import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface Solicitud {
  id: string;
  titulo: string;
  descripcion: string;
  area_id: string;
  solicitante_id: string;
  estado: 'pendiente' | 'aceptada' | 'en_ejecucion' | 'cerrada';
  fecha_creacion: string;
  fecha_aceptacion?: string;
  aceptada_por?: string;
  fecha_cierre?: string;
  cerrada_por?: string;
  fecha_inicio_ejecucion?: string;
  progreso_ejecucion?: string;
  horas_transcurridas?: number;
  dias_pendientes?: number;
  departamento?: { nombre: string };
  solicitante?: { full_name: string };
  profiles?: { full_name: string };
}

export interface CrearSolicitudData {
  titulo: string;
  descripcion: string;
  area_id: string;
}

export const useSolicitudes = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Obtener todas las solicitudes con filtrado por área del usuario
  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];

        // Obtener áreas asignadas al usuario
        const { data: userAreas, error: areasError } = await supabase
          .from('user_area_access')
          .select('area_id')
          .eq('user_id', user.id);

        if (areasError) {
          console.error('Error fetching user areas:', areasError);
        }

        const userAreaIds = userAreas?.map(ua => ua.area_id) || [];

        let query = supabase
          .from('solicitudes')
          .select(`
            *,
            area:areas!solicitudes_area_id_fkey(nombre),
            profiles!solicitudes_solicitante_id_fkey(full_name)
          `);

        // Filtrar por áreas si el usuario tiene áreas asignadas
        if (userAreaIds.length > 0) {
          query = query.in('area_id', userAreaIds);
        }

        const { data, error } = await query.order('fecha_creacion', { ascending: false });

        if (error) {
          console.error('Error fetching solicitudes:', error);
          throw error;
        }

        if (!data) return [];

        // Calcular días pendientes y horas transcurridas para cada solicitud
        const solicitudesConTiempo = await Promise.all(
          data.map(async (solicitud: any) => {
            let diasPendientes = 0;
            let horasTranscurridas = 0;

            if (solicitud.estado === 'pendiente') {
              try {
                const { data: diasData } = await supabase
                  .rpc('calcular_dias_pendientes', { p_solicitud_id: solicitud.id });
                diasPendientes = diasData || 0;
              } catch (error) {
                console.error('Error calculating days:', error);
              }
            }

            // Calcular horas transcurridas para todas las solicitudes (desde creación hasta cierre)
            try {
              const { data: horasData } = await supabase
                .rpc('calcular_horas_solicitud', { p_solicitud_id: solicitud.id });
              horasTranscurridas = horasData || 0;
            } catch (error) {
              console.error('Error calculating hours:', error);
            }

            return { 
              ...solicitud, 
              dias_pendientes: diasPendientes,
              horas_transcurridas: horasTranscurridas
            };
          })
        );

        return solicitudesConTiempo;
      } catch (error) {
        console.error('Error in solicitudes query:', error);
        return [];
      }
    },
  });

  // Crear nueva solicitud
  const crearSolicitud = useMutation({
    mutationFn: async (datos: CrearSolicitudData) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('solicitudes')
        .insert({
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          area_id: datos.area_id,
          solicitante_id: user.id,
        })
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast({
        title: 'Solicitud creada',
        description: 'La solicitud ha sido creada exitosamente.',
      });
    },
    onError: (error) => {
      console.error('Error al crear solicitud:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al crear la solicitud.',
        variant: 'destructive',
      });
    },
  });

  // Aceptar solicitud - cambia automáticamente a "en ejecución" 
  const aceptarSolicitud = useMutation({
    mutationFn: async (solicitudId: string) => {
      const { data, error } = await supabase
        .from('solicitudes')
        .update({
          estado: 'en_ejecucion',
          fecha_aceptacion: new Date().toISOString(),
          aceptada_por: user?.id,
        })
        .eq('id', solicitudId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast({
        title: 'Solicitud aceptada',
        description: 'La solicitud está ahora en ejecución.',
      });
    },
    onError: (error) => {
      console.error('Error al aceptar solicitud:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al aceptar la solicitud.',
        variant: 'destructive',
      });
    },
  });

  // Actualizar progreso de ejecución
  const actualizarProgreso = useMutation({
    mutationFn: async ({ solicitudId, progreso }: { solicitudId: string; progreso: string }) => {
      if (progreso.length < 100) {
        throw new Error('El progreso debe tener al menos 100 caracteres');
      }

      const { data, error } = await supabase
        .from('solicitudes')
        .update({ progreso_ejecucion: progreso })
        .eq('id', solicitudId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast({
        title: 'Progreso actualizado',
        description: 'El progreso de la solicitud ha sido actualizado.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Hubo un error al actualizar el progreso.',
        variant: 'destructive',
      });
    },
  });

  // Cerrar solicitud
  const cerrarSolicitud = useMutation({
    mutationFn: async (solicitudId: string) => {
      const { data, error } = await supabase
        .from('solicitudes')
        .update({
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
          cerrada_por: user?.id,
        })
        .eq('id', solicitudId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast({
        title: 'Solicitud cerrada',
        description: 'La solicitud ha sido cerrada exitosamente.',
      });
    },
    onError: (error) => {
      console.error('Error al cerrar solicitud:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al cerrar la solicitud.',
        variant: 'destructive',
      });
    },
  });

  return {
    solicitudes,
    isLoading,
    crearSolicitud: crearSolicitud.mutateAsync,
    isCreating: crearSolicitud.isPending,
    aceptarSolicitud: aceptarSolicitud.mutateAsync,
    isAccepting: aceptarSolicitud.isPending,
    actualizarProgreso: actualizarProgreso.mutateAsync,
    isUpdatingProgress: actualizarProgreso.isPending,
    cerrarSolicitud: cerrarSolicitud.mutateAsync,
    isClosing: cerrarSolicitud.isPending,
  };
};