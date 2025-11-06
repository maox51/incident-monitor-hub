-- Eliminar las políticas SELECT restrictivas existentes
DROP POLICY IF EXISTS "Usuarios con roles específicos pueden ver incidencias de su á" ON incidencias;
DROP POLICY IF EXISTS "Usuarios pueden ver incidencias según su rol" ON incidencias;
DROP POLICY IF EXISTS "Monitores pueden ver sus propias incidencias" ON incidencias;

-- Crear una nueva política que permita a todos los usuarios autenticados ver todas las incidencias
CREATE POLICY "Todos los usuarios autenticados pueden ver todas las incidencias"
ON incidencias
FOR SELECT
TO authenticated
USING (true);