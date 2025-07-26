
-- Primero, vamos a verificar qué administradores existen y crear configuraciones de notificación
-- También vamos a insertar configuraciones para TODOS los usuarios como medida temporal

-- Verificar si existen perfiles de administradores
DO $$
BEGIN
  RAISE NOTICE 'Verificando administradores existentes...';
END
$$;

-- Crear configuraciones de notificación para TODOS los usuarios autenticados como medida temporal
INSERT INTO public.notification_settings (user_id, email_notifications, high_priority_alerts, created_at, updated_at)
SELECT 
  p.id,
  CASE WHEN p.role = 'admin' OR p.role = 'supervisor_monitoreo' THEN true ELSE false END as email_notifications,
  CASE WHEN p.role = 'admin' OR p.role = 'supervisor_monitoreo' THEN true ELSE false END as high_priority_alerts,
  now() as created_at,
  now() as updated_at
FROM public.profiles p
WHERE p.email IS NOT NULL
AND LENGTH(TRIM(p.email)) > 0
ON CONFLICT (user_id) DO UPDATE SET
  email_notifications = CASE WHEN EXCLUDED.user_id IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'supervisor_monitoreo')
  ) THEN true ELSE notification_settings.email_notifications END,
  high_priority_alerts = CASE WHEN EXCLUDED.user_id IN (
    SELECT id FROM public.profiles WHERE role IN ('admin', 'supervisor_monitoreo')  
  ) THEN true ELSE notification_settings.high_priority_alerts END,
  updated_at = now();

-- Si no hay registros, crear uno para el usuario actual (asumiendo que eres admin)
INSERT INTO public.notification_settings (user_id, email_notifications, high_priority_alerts, created_at, updated_at)
SELECT 
  auth.uid(),
  true,
  true,
  now(),
  now()
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM public.notification_settings WHERE user_id = auth.uid())
ON CONFLICT (user_id) DO UPDATE SET
  email_notifications = true,
  high_priority_alerts = true,
  updated_at = now();

-- Crear función auxiliar para verificar administradores con notificaciones habilitadas
CREATE OR REPLACE FUNCTION public.get_notification_admins()
RETURNS TABLE(
  id uuid,
  email text,
  full_name text,
  role text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text
  FROM public.profiles p
  INNER JOIN public.notification_settings ns ON p.id = ns.user_id
  WHERE (p.role = 'admin' OR p.role = 'supervisor_monitoreo')
    AND ns.email_notifications = true
    AND ns.high_priority_alerts = true
    AND p.email IS NOT NULL
    AND LENGTH(TRIM(p.email)) > 0;
$$;
