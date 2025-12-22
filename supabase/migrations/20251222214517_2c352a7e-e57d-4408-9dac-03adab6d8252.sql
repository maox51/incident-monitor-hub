-- Actualizar política RLS para que monitores vean todas las solicitudes como supervisor_monitoreo
DROP POLICY IF EXISTS "Usuarios pueden ver solicitudes según rol y área" ON public.solicitudes;

CREATE POLICY "Usuarios pueden ver solicitudes según rol y área" 
ON public.solicitudes 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor_monitoreo'::app_role) OR 
  has_role(auth.uid(), 'monitor'::app_role) OR
  (has_role(auth.uid(), 'rrhh'::app_role) AND user_has_area_access(auth.uid(), area_id)) OR
  (has_role(auth.uid(), 'finanzas'::app_role) AND user_has_area_access(auth.uid(), area_id)) OR
  (has_role(auth.uid(), 'supervisor_salas'::app_role) AND user_has_area_access(auth.uid(), area_id)) OR
  user_has_area_access(auth.uid(), area_id)
);

-- También actualizar política de UPDATE para monitores
DROP POLICY IF EXISTS "Usuarios con permisos pueden actualizar solicitudes" ON public.solicitudes;

CREATE POLICY "Usuarios con permisos pueden actualizar solicitudes" 
ON public.solicitudes 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'supervisor_monitoreo'::app_role) OR 
  has_role(auth.uid(), 'monitor'::app_role) OR
  user_has_area_access(auth.uid(), area_id) OR
  has_role(auth.uid(), 'rrhh'::app_role) OR
  has_role(auth.uid(), 'supervisor_salas'::app_role) OR
  has_role(auth.uid(), 'finanzas'::app_role)
);