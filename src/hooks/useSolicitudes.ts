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
  dias_pendientes?: number;
  area?: { nombre: string };
  areas?: { nombre: string };
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

  // Obtener todas las solicitudes
  const { data: solicitudes = [], isLoading } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('solicitudes')
          .select(`
            *,
            areas!solicitudes_area_id_fkey(nombre),
            profiles!solicitudes_solicitante_id_fkey(full_name)
          `)
          .order('fecha_creacion', { ascending: false });

        if (error) {
          console.error('Error fetching solicitudes:', error);
          throw error;
        }

        if (!data) return [];

        // Calcular días pendientes para cada solicitud
        const solicitudesConDias = await Promise.all(
          data.map(async (solicitud: any) => {
            if (solicitud.estado === 'pendiente') {
              try {
                const { data: diasData } = await supabase
                  .rpc('calcular_dias_pendientes', { p_solicitud_id: solicitud.id });
                return { ...solicitud, dias_pendientes: diasData || 0 };
              } catch (error) {
                console.error('Error calculating days:', error);
                return { ...solicitud, dias_pendientes: 0 };
              }
            }
            return { ...solicitud, dias_pendientes: 0 };
          })
        );

        return solicitudesConDias;
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

  // Aceptar solicitud
  const aceptarSolicitud = useMutation({
    mutationFn: async (solicitudId: string) => {
      const { data, error } = await supabase
        .from('solicitudes')
        .update({
          estado: 'aceptada',
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
        description: 'La solicitud ha sido aceptada exitosamente.',
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

  // Cambiar estado a "en ejecución"
  const iniciarEjecucion = useMutation({
    mutationFn: async (solicitudId: string) => {
      const { data, error } = await supabase
        .from('solicitudes')
        .update({ estado: 'en_ejecucion' })
        .eq('id', solicitudId)
        .select()
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
      toast({
        title: 'Solicitud en ejecución',
        description: 'La solicitud está ahora en ejecución.',
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
    iniciarEjecucion: iniciarEjecucion.mutateAsync,
    isStarting: iniciarEjecucion.isPending,
    cerrarSolicitud: cerrarSolicitud.mutateAsync,
    isClosing: cerrarSolicitud.isPending,
  };
};