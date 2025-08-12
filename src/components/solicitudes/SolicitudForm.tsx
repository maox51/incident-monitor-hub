import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useSolicitudes, type CrearSolicitudData } from '@/hooks/useSolicitudes';

interface SolicitudFormProps {
  onCancel: () => void;
}

export const SolicitudForm = ({ onCancel }: SolicitudFormProps) => {
  const [formData, setFormData] = useState<CrearSolicitudData>({
    titulo: '',
    descripcion: '',
    departamento_id: '',
  });

  const { crearSolicitud, isCreating } = useSolicitudes();

  // Obtener departamentos disponibles
  const { data: areas = [] } = useQuery({
    queryKey: ['departamentos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departamentos')
        .select('id, nombre')
        .eq('activo', true)
        .order('nombre');

      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.descripcion.trim() || !formData.departamento_id) {
      return;
    }

    try {
      await crearSolicitud(formData);
      setFormData({ titulo: '', descripcion: '', departamento_id: '' });
      onCancel();
    } catch (error) {
      console.error('Error al crear solicitud:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Nueva Solicitud</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ingrese el título de la solicitud"
              required
            />
          </div>

          <div>
            <Label htmlFor="area">Área Destino</Label>
            <Select
              value={formData.departamento_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, departamento_id: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccione el área destino" />
              </SelectTrigger>
              <SelectContent>
                {areas.map((area) => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describa detalladamente su solicitud"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creando...' : 'Crear Solicitud'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};