import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

export interface Solicitud {
  id: string;
  titulo: string;
  descripcion: string;
  area_id?: string; // Opcional para compatibilidad con la base de datos actual
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
  area?: { nombre: string };
  profiles?: { full_name: string };
  // Mantener compatibilidad con estructura anterior
  departamento_id?: string;
  [key: string]: any; // Para flexibilidad durante la transición
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
    queryKey: ['solicitudes', user?.id],
    queryFn: async () => {
      try {
        if (!user?.id) return [];

        // Verificar si es admin o supervisor de monitoreo
        const { data: isAdminOrSupervisor } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'admin' });
        
        const { data: isSupervisorMonitoreo } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'supervisor_monitoreo' });

        let query = supabase
          .from('solicitudes')
          .select(`
            *,
            area:areas(nombre),
            profiles:solicitante_id(full_name)
          `);

        // Si no es admin ni supervisor de monitoreo, filtrar por área del usuario
        if (!isAdminOrSupervisor && !isSupervisorMonitoreo) {
          // Filtrar por área del usuario o sus propias solicitudes
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('area_id')
            .eq('id', user.id)
            .single();

          // Obtener áreas asignadas al usuario
          const { data: userAreas } = await supabase
            .from('user_area_access')
            .select('area_id')
            .eq('user_id', user.id);

          if (userProfile?.area_id || (userAreas && userAreas.length > 0)) {
            const areaIds = [];
            if (userProfile?.area_id) areaIds.push(userProfile.area_id);
            if (userAreas) areaIds.push(...userAreas.map(ua => ua.area_id));
            
            query = query.in('area_id', areaIds);
          } else {
            // Si no tiene área asignada, solo ver sus propias solicitudes
            query = query.eq('solicitante_id', user.id);
          }
        }

        const { data, error } = await query.order('fecha_creacion', { ascending: false });

        if (error) {
          console.error('Error fetching solicitudes:', error);
          return [];
        }

        return data || [];
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

      try {
        // Intentar insertar directamente como una operación simple
        const insertData = {
          titulo: datos.titulo,
          descripcion: datos.descripcion,
          area_id: datos.area_id,
          solicitante_id: user.id,
        };

        const { data, error } = await supabase
          .from('solicitudes')
          .insert(insertData as any)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Error creating solicitud:', error);
        throw error;
      }
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
          estado: 'en_ejecucion',
          fecha_aceptacion: new Date().toISOString(),
          aceptada_por: user?.id,
        } as any)
        .eq('id', solicitudId)
        .select()
        .single();

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

  // Actualizar progreso
  const actualizarProgreso = useMutation({
    mutationFn: async ({ solicitudId, progreso }: { solicitudId: string; progreso: string }) => {
      if (progreso.length < 100) {
        throw new Error('El progreso debe tener al menos 100 caracteres');
      }

      const { data, error } = await supabase
        .from('solicitudes')
        .update({ progreso_ejecucion: progreso } as any)
        .eq('id', solicitudId)
        .select()
        .single();

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
    mutationFn: async ({ solicitudId, accionesRealizadas }: { solicitudId: string; accionesRealizadas?: string }) => {
      // Primero obtener la solicitud actual para conservar el progreso existente
      const { data: solicitudActual } = await supabase
        .from('solicitudes')
        .select('progreso_ejecucion')
        .eq('id', solicitudId)
        .single();

      const { data, error } = await supabase
        .from('solicitudes')
        .update({
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString(),
          cerrada_por: user?.id,
          progreso_ejecucion: accionesRealizadas 
            ? `${solicitudActual?.progreso_ejecucion || ''}\n\n--- ACCIONES DE CIERRE ---\n${accionesRealizadas}`.trim()
            : solicitudActual?.progreso_ejecucion
        } as any)
        .eq('id', solicitudId)
        .select()
        .single();

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