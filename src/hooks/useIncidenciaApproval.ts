
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuditLog } from "./useAuditLog";

export const useIncidenciaApproval = () => {
  const queryClient = useQueryClient();
  const { logAction } = useAuditLog();

  const approveIncidencia = useMutation({
    mutationFn: async ({ id, newState }: { id: string; newState: string }) => {
      console.log('🔄 Aprobando incidencia:', id, 'nuevo estado:', newState);
      
      // Primero obtener los detalles de la incidencia para el contador quincenal
      const { data: incidencia, error: fetchError } = await supabase
        .from('incidencias')
        .select(`
          *,
          departamentos!incidencias_departamento_id_fkey(nombre),
          clasificaciones(nombre),
          salas(nombre)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching incidencia details:', fetchError);
        throw fetchError;
      }

      // Aprobar la incidencia usando la función RPC
      const { data, error } = await supabase.rpc('aprobar_incidencia', {
        incidencia_id: id,
        nuevo_estado: newState
      });

      if (error) {
        console.error('❌ Error approving incidencia:', error);
        throw error;
      }

      // Si la incidencia fue aprobada y tiene tiempo_minutos, actualizar contador quincenal
      if (newState === 'aprobado' && incidencia.tiempo_minutos && incidencia.sala_id) {
        console.log('📊 Actualizando contador quincenal para sala:', incidencia.salas?.nombre);
        
        // Determinar el tipo de incidencia basado en la clasificación
        let tipoIncidencia = null;
        const clasificacionNombre = incidencia.clasificaciones?.nombre?.toLowerCase() || '';
        
        if (clasificacionNombre.includes('ingreso') && clasificacionNombre.includes('tardio')) {
          tipoIncidencia = 'ingreso_tardio';
        } else if (clasificacionNombre.includes('cierre') && clasificacionNombre.includes('prematuro')) {
          tipoIncidencia = 'cierre_prematuro';
        }

        if (tipoIncidencia) {
          console.log('🔢 Actualizando contador quincenal:', {
            sala_id: incidencia.sala_id,
            tipo: tipoIncidencia,
            minutos: incidencia.tiempo_minutos,
            fecha: incidencia.fecha_incidencia
          });

          const { error: conteoError } = await supabase.rpc('actualizar_conteo_quincenal_sala', {
            p_sala_id: incidencia.sala_id,
            p_tipo_incidencia: tipoIncidencia,
            p_minutos: incidencia.tiempo_minutos,
            p_fecha: incidencia.fecha_incidencia.split('T')[0] // Solo la fecha, sin hora
          });

          if (conteoError) {
            console.error('❌ Error updating quincenal count:', conteoError);
            // No fallar la aprobación por esto, solo mostrar warning
            toast.warning('Incidencia aprobada, pero hubo un problema actualizando las estadísticas quincenales');
          } else {
            console.log('✅ Contador quincenal actualizado exitosamente');
          }
        } else {
          console.log('ℹ️ Clasificación no coincide con tipos quincenales, saltando actualización');
        }
      }

      // Enviar notificación si es alta o crítica
      if (newState === 'aprobado' && (incidencia.prioridad === 'alta' || incidencia.prioridad === 'critica')) {
        console.log('🚨 Enviando notificación para incidencia de alta prioridad');
        
        try {
          const { error: notificationError } = await supabase.functions.invoke('send-notification', {
            body: {
              incidencia_id: incidencia.id,
              titulo: incidencia.titulo,
              descripcion: incidencia.descripcion,
              prioridad: incidencia.prioridad,
              area_nombre: incidencia.departamentos?.nombre || '',
              clasificacion_nombre: incidencia.clasificaciones?.nombre || '',
              reportado_por: incidencia.reportado_por,
              sala_nombre: incidencia.salas?.nombre || '',
              tiempo_minutos: incidencia.tiempo_minutos
            }
          });

          if (notificationError) {
            console.error('❌ Error sending notification:', notificationError);
            toast.error('Incidencia aprobada, pero hubo un error enviando las notificaciones');
          } else {
            console.log('✅ Notification sent successfully');
          }
        } catch (notifError) {
          console.error('❌ Unexpected error sending notification:', notifError);
        }
      }

      return data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['incidencias'] });
      queryClient.invalidateQueries({ queryKey: ['incidencias-borradores'] });
      queryClient.invalidateQueries({ queryKey: ['quinzenal-stats'] });
      queryClient.invalidateQueries({ queryKey: ['period-comparison'] });
      
      toast.success('Incidencia procesada exitosamente');
    },
    onError: (error: any) => {
      console.error('❌ Error in approval mutation:', error);
      toast.error('Error al procesar la incidencia: ' + error.message);
    }
  });

  return {
    approveIncidencia: approveIncidencia.mutate,
    isApproving: approveIncidencia.isPending
  };
};
