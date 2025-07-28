
import { useEffect } from 'react';
import { useAuditLog } from './useAuditLog';
import { useAuth } from './useAuth';

export const usePageAudit = (page: string, additionalData?: any) => {
  const { logAction } = useAuditLog();
  const { user, profile } = useAuth();

  useEffect(() => {
    // Verificar si hay un usuario autenticado
    if (!user) {
      console.log('No hay usuario autenticado, omitiendo auditoría de página');
      return;
    }

    let mounted = true;

    const logPageView = async () => {
      try {
        if (!mounted) return;
        
        const auditData = {
          page,
          userRole: profile?.role || 'unknown',
          userEmail: user.email,
          sessionStart: new Date().toISOString(),
          profileLoaded: !!profile,
          ...additionalData
        };

        console.log(`Logging page view: ${page} para usuario: ${user.email}`);
        
        await logAction(`view_${page}`, page, null, auditData);
      } catch (error) {
        console.error('Error logging page view:', error);
      }
    };

    // Log inmediato al cargar la página
    logPageView();

    // Log periódico para medir tiempo de actividad (cada 5 minutos)
    const intervalId = setInterval(() => {
      if (!mounted) return;
      
      logAction(`activity_${page}`, page, null, {
        page,
        userEmail: user.email,
        activityCheck: true,
        timestamp: new Date().toISOString()
      });
    }, 5 * 60 * 1000);

    // Cleanup al desmontar
    return () => {
      mounted = false;
      clearInterval(intervalId);
      
      if (user?.email) {
        logAction(`leave_${page}`, page, null, {
          page,
          userEmail: user.email,
          sessionEnd: new Date().toISOString(),
          sessionDuration: 'calculated_on_server'
        });
      }
    };
  }, [page, user?.id, user?.email, profile?.role, logAction, additionalData]);
};

// Hook específico para logging de autenticación
export const useAuthAudit = () => {
  const { logAction } = useAuditLog();

  const logLogin = async (userEmail: string, userRole: string, additionalInfo?: any) => {
    console.log(`Registrando login para: ${userEmail} con rol: ${userRole}`);
    
    try {
      await logAction('user_login', 'auth', null, {
        userEmail,
        userRole,
        loginTimestamp: new Date().toISOString(),
        loginMethod: 'email_password',
        ...additionalInfo
      });
      console.log(`Login registrado exitosamente para: ${userEmail}`);
    } catch (error) {
      console.error(`Error registrando login para ${userEmail}:`, error);
    }
  };

  const logLogout = async (userEmail: string) => {
    console.log(`Registrando logout para: ${userEmail}`);
    
    try {
      await logAction('user_logout', 'auth', null, {
        userEmail,
        logoutTimestamp: new Date().toISOString()
      });
      console.log(`Logout registrado exitosamente para: ${userEmail}`);
    } catch (error) {
      console.error(`Error registrando logout para ${userEmail}:`, error);
    }
  };

  const logAuthError = async (error: string, attemptedEmail?: string) => {
    console.log(`Registrando error de auth: ${error} para email: ${attemptedEmail}`);
    
    try {
      await logAction('auth_error', 'auth', null, {
        error,
        attemptedEmail,
        errorTimestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    } catch (logError) {
      console.error('Error registrando error de auth:', logError);
    }
  };

  return { logLogin, logLogout, logAuthError };
};

// Hook para logging de acciones críticas del sistema
export const useSystemAudit = () => {
  const { logAction } = useAuditLog();

  const logCriticalAction = async (
    action: string, 
    resourceType: string, 
    resourceId?: string, 
    details?: any
  ) => {
    console.log(`Registrando acción crítica: ${action}`);
    
    try {
      await logAction(`critical_${action}`, resourceType, resourceId, {
        ...details,
        criticalAction: true,
        timestamp: new Date().toISOString(),
        stackTrace: new Error().stack
      });
    } catch (error) {
      console.error('Error registrando acción crítica:', error);
    }
  };

  const logSecurityEvent = async (event: string, details?: any) => {
    console.log(`Registrando evento de seguridad: ${event}`);
    
    try {
      await logAction(`security_${event}`, 'security', null, {
        ...details,
        securityEvent: true,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error registrando evento de seguridad:', error);
    }
  };

  return { logCriticalAction, logSecurityEvent };
};
