
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useIncidenciaApproval = () => {
  const approveIncidencia = useMutation({
    mutationFn: async ({ incidenciaId, nuevoEstado }: { incidenciaId: string; nuevoEstado: string }) => {
      console.log('🔄 Attempting to approve incident:', incidenciaId, 'with state:', nuevoEstado);
      
      // Primero aprobar la incidencia
      const { data: result, error } = await supabase.rpc('aprobar_incidencia', {
        incidencia_id: incidenciaId,
        nuevo_estado: nuevoEstado
      });

      if (error) {
        console.error('❌ Error approving incident:', error);
        throw error;
      }

      console.log('✅ Incident approved successfully');

      // Ahora obtener los datos completos de la incidencia para enviar notificación
      if (nuevoEstado === 'aprobado') {
        console.log('📧 Fetching incident details for notification...');
        
        const { data: incidencia, error: fetchError } = await supabase
          .from('incidencias')
          .select(`
            id,
            titulo,
            descripcion,
            prioridad,
            reportado_por,
            areas:area_id(nombre),
            clasificaciones:clasificacion_id(nombre)
          `)
          .eq('id', incidenciaId)
          .single();

        if (fetchError) {
          console.error('❌ Error fetching incident details:', fetchError);
          // No fallar la aprobación si hay error obteniendo detalles para notificación
          return result;
        }

        console.log('📝 Incident details:', incidencia);

        // Enviar notificación si es prioridad alta o crítica
        if (incidencia.prioridad === 'alta' || incidencia.prioridad === 'critica') {
          console.log('🚨 Sending notification for high/critical priority incident');
          
          try {
            const { data: notificationResult, error: notificationError } = await supabase.functions.invoke('send-notification', {
              body: {
                incidencia_id: incidencia.id,
                titulo: incidencia.titulo,
                descripcion: incidencia.descripcion,
                prioridad: incidencia.prioridad,
                area_nombre: incidencia.areas?.nombre || '',
                clasificacion_nombre: incidencia.clasificaciones?.nombre || '',
                reportado_por: incidencia.reportado_por
              }
            });

            if (notificationError) {
              console.error('❌ Error sending notification:', notificationError);
              toast.error('Incidencia aprobada, pero hubo un error enviando las notificaciones');
            } else {
              console.log('✅ Notification sent successfully:', notificationResult);
              toast.success('Incidencia aprobada y notificaciones enviadas exitosamente');
            }
          } catch (notifError) {
            console.error('❌ Unexpected error sending notification:', notifError);
            toast.error('Incidencia aprobada, pero hubo un problema enviando las notificaciones');
          }
        } else {
          console.log('ℹ️ Priority is not high enough for notification:', incidencia.prioridad);
          toast.success('Incidencia aprobada exitosamente');
        }
      }

      return result;
    },
    onError: (error) => {
      console.error('❌ Error in approval process:', error);
      toast.error('Error al aprobar la incidencia: ' + error.message);
    }
  });

  return { approveIncidencia };
};
