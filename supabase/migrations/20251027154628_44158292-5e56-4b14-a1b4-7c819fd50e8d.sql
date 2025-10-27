-- Permitir que monitores puedan actualizar solicitudes (aceptar y cerrar)
CREATE POLICY "monitores_pueden_actualizar_solicitudes"
ON public.solicitudes
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'monitor'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid() 
    AND p.role = 'monitor'::app_role
  )
);