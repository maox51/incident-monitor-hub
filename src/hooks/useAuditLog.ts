
import { supabase } from "@/integrations/supabase/client";

export const useAuditLog = () => {
  const getClientIP = async (): Promise<string | null> => {
    try {
      // Intentar múltiples servicios para obtener la IP
      const ipServices = [
        'https://api.ipify.org?format=json',
        'https://ipapi.co/json/',
        'https://ip.seeip.org/jsonip',
        'https://httpbin.org/ip'
      ];

      for (const service of ipServices) {
        try {
          // Usar AbortController para timeout manual
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const response = await fetch(service, { 
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            // Diferentes servicios retornan la IP en diferentes campos
            const ip = data.ip || data.IPv4 || data.query || data.origin;
            if (ip) {
              console.log(`IP obtenida desde ${service}: ${ip}`);
              return ip;
            }
          }
        } catch (serviceError) {
          console.warn(`Fallo al obtener IP desde ${service}:`, serviceError);
          continue; // Intentar el siguiente servicio
        }
      }
      
      console.warn('No se pudo obtener la IP desde ningún servicio');
      return null;
    } catch (error) {
      console.warn('Error general obteniendo IP:', error);
      return null;
    }
  };

  const getEnhancedUserAgent = (): string => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform || 'Unknown';
    const language = navigator.language || 'Unknown';
    const cookieEnabled = navigator.cookieEnabled;
    const screenResolution = `${screen.width}x${screen.height}`;
    
    // Detectar si es dispositivo móvil
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    return JSON.stringify({
      userAgent,
      platform,
      language,
      cookieEnabled,
      screenResolution,
      deviceType,
      timestamp: new Date().toISOString()
    });
  };

  const logAction = async (
    actionType: string,
    resourceType?: string,
    resourceId?: string,
    details?: any
  ) => {
    try {
      // Obtener información del navegador mejorada
      const userAgent = getEnhancedUserAgent();
      
      // Intentar obtener IP, pero no bloquear el logging si falla
      let ipAddress: string | null = null;
      try {
        ipAddress = await getClientIP();
      } catch (ipError) {
        console.warn('Failed to get IP for audit log, continuing without it:', ipError);
        ipAddress = 'unknown';
      }

      // Enriquecer los detalles con información adicional
      const enrichedDetails = {
        ...details,
        sessionTimestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        referrer: document.referrer || 'direct',
        url: window.location.href,
        deviceInfo: {
          isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          isTablet: /iPad/i.test(navigator.userAgent),
          screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
          }
        }
      };

      const { data, error } = await supabase.rpc('log_user_action', {
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_details: enrichedDetails ? JSON.stringify(enrichedDetails) : null,
        p_ip_address: ipAddress,
        p_user_agent: userAgent
      });

      if (error) {
        console.error('Error logging action:', error);
        // Still try to log a simplified version if the main logging fails
        try {
          await supabase.rpc('log_user_action', {
            p_action_type: actionType,
            p_resource_type: resourceType,
            p_resource_id: resourceId,
            p_details: JSON.stringify({ error: 'fallback_log', timestamp: new Date().toISOString() }),
            p_ip_address: 'unknown',
            p_user_agent: 'unknown'
          });
        } catch (fallbackError) {
          console.error('Fallback logging also failed:', fallbackError);
        }
        return null;
      }

      console.log(`Acción registrada: ${actionType}`, { resourceType, resourceId, ipAddress });
      return data;
    } catch (error) {
      console.error('Error in audit log:', error);
      // Final fallback - try simple logging
      try {
        await supabase.rpc('log_user_action', {
          p_action_type: `fallback_${actionType}`,
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_details: JSON.stringify({ error: 'main_log_failed', timestamp: new Date().toISOString() }),
          p_ip_address: 'unknown',
          p_user_agent: 'unknown'
        });
      } catch (finalError) {
        console.error('All logging attempts failed:', finalError);
      }
      return null;
    }
  };

  return { logAction, getClientIP };
};
