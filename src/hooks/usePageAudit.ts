import { useEffect } from 'react';
import { useAuditLog } from './useAuditLog';
import { useAuth } from './useAuth';

export const usePageAudit = (page: string, additionalData?: any) => {
  const { logAction } = useAuditLog();
  const { user, profile } = useAuth();

  useEffect(() => {
    if (!user || !profile) return;

    const logPageView = async () => {
      try {
        await logAction(`view_${page}`, page, null, {
          page,
          userRole: profile.role,
          sessionStart: new Date().toISOString(),
          ...additionalData
        });
      } catch (error) {
        console.error('Error logging page view:', error);
      }
    };

    // Log inmediato al cargar la página
    logPageView();

    // Log periódico para medir tiempo de actividad (cada 5 minutos)
    const intervalId = setInterval(() => {
      logAction(`activity_${page}`, page, null, {
        page,
        activityCheck: true,
        timestamp: new Date().toISOString()
      });
    }, 5 * 60 * 1000); // 5 minutos

    // Cleanup al desmontar
    return () => {
      clearInterval(intervalId);
      logAction(`leave_${page}`, page, null, {
        page,
        sessionEnd: new Date().toISOString(),
        sessionDuration: 'calculated_on_server'
      });
    };
  }, [page, user, profile, logAction, additionalData]);
};

// Hook específico para logging de autenticación
export const useAuthAudit = () => {
  const { logAction } = useAuditLog();

  const logLogin = async (userEmail: string, userRole: string) => {
    await logAction('user_login', 'auth', null, {
      userEmail,
      userRole,
      loginTimestamp: new Date().toISOString()
    });
  };

  const logLogout = async (userEmail: string) => {
    await logAction('user_logout', 'auth', null, {
      userEmail,
      logoutTimestamp: new Date().toISOString()
    });
  };

  const logAuthError = async (error: string, attemptedEmail?: string) => {
    await logAction('auth_error', 'auth', null, {
      error,
      attemptedEmail,
      errorTimestamp: new Date().toISOString()
    });
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
    await logAction(`critical_${action}`, resourceType, resourceId, {
      ...details,
      criticalAction: true,
      timestamp: new Date().toISOString(),
      stackTrace: new Error().stack // Para debugging
    });
  };

  const logSecurityEvent = async (event: string, details?: any) => {
    await logAction(`security_${event}`, 'security', null, {
      ...details,
      securityEvent: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  };

  return { logCriticalAction, logSecurityEvent };
};