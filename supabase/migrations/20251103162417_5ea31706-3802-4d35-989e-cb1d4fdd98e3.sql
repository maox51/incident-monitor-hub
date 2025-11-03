-- Crear función para obtener usuarios que deben recibir notificaciones de solicitudes
CREATE OR REPLACE FUNCTION public.get_solicitudes_notification_users()
RETURNS TABLE(id uuid, email text, full_name text, role text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role::text
  FROM public.profiles p
  WHERE (p.role = 'admin' OR p.role = 'supervisor_monitoreo' OR p.role = 'monitor')
    AND p.email IS NOT NULL
    AND LENGTH(TRIM(p.email)) > 0;
$$;

-- Crear trigger para enviar notificaciones de nuevas solicitudes
CREATE OR REPLACE FUNCTION public.handle_new_solicitud_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Llamar a la función de notificación por correo
  PERFORM net.http_post(
    url := 'https://wbuddpspfxufhftkcaww.supabase.co/functions/v1/send-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('request.header.apikey', true)
    ),
    body := jsonb_build_object(
      'tipo', 'solicitud',
      'solicitud_id', NEW.id::text,
      'titulo', NEW.titulo,
      'descripcion', NEW.descripcion,
      'area_id', NEW.area_id::text,
      'area_nombre', (SELECT nombre FROM public.areas WHERE id = NEW.area_id),
      'solicitante_id', NEW.solicitante_id::text,
      'solicitante_nombre', (SELECT full_name FROM public.profiles WHERE id = NEW.solicitante_id)
    )
  );
  
  RETURN NEW;
END;
$$;

-- Crear el trigger en la tabla solicitudes
CREATE TRIGGER on_solicitud_created
  AFTER INSERT ON public.solicitudes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_solicitud_notification();