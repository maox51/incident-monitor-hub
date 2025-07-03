
import { supabase } from "@/integrations/supabase/client";

export const useAuditLog = () => {
  const logAction = async (
    actionType: string,
    resourceType?: string,
    resourceId?: string,
    details?: any
  ) => {
    try {
      // Obtener información del navegador
      const userAgent = navigator.userAgent;
      
      // Intentar obtener IP (en producción esto sería manejado por el servidor)
      let ipAddress = null;
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch (error) {
        console.log('No se pudo obtener la IP:', error);
      }

      const { data, error } = await supabase.rpc('log_user_action', {
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: details ? JSON.stringify(details) : null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Error logging action:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in audit log:', error);
      return null;
    }
  };

  return { logAction };
};
