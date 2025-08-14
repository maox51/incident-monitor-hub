import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface GestionPagoData {
  descripcion: string;
  monto?: number;
  concepto: string;
}

interface ImagenSubida {
  id: string;
  url: string;
  nombre: string;
}

export const GestionPagoDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<GestionPagoData>({
    descripcion: '',
    monto: undefined,
    concepto: '',
  });
  const [imagenes, setImagenes] = useState<ImagenSubida[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const nuevasImagenes: ImagenSubida[] = [];

    for (const file of Array.from(files)) {
      try {
        // Validar tipo de archivo
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Archivo no válido',
            description: `${file.name} no es una imagen válida`,
            variant: 'destructive',
          });
          continue;
        }

        // Validar tamaño (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Archivo muy grande',
            description: `${file.name} excede el tamaño máximo de 5MB`,
            variant: 'destructive',
          });
          continue;
        }

        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `pagos/${fileName}`;

        const { data, error } = await supabase.storage
          .from('incidencias-images')
          .upload(filePath, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from('incidencias-images')
          .getPublicUrl(filePath);

        nuevasImagenes.push({
          id: fileName,
          url: publicUrl,
          nombre: file.name,
        });
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: 'Error de carga',
          description: `Error al subir ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    setImagenes(prev => [...prev, ...nuevasImagenes]);
    setIsUploading(false);
  };

  const removeImage = async (imageId: string) => {
    const imagen = imagenes.find(img => img.id === imageId);
    if (imagen) {
      try {
        const filePath = `pagos/${imagen.id}`;
        await supabase.storage
          .from('incidencias-images')
          .remove([filePath]);
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }

    setImagenes(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.descripcion.trim() || !formData.concepto.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Por favor complete todos los campos obligatorios',
        variant: 'destructive',
      });
      return;
    }

    if (imagenes.length === 0) {
      toast({
        title: 'Imágenes requeridas',
        description: 'Debe subir al menos una imagen como soporte',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Obtener el primer área disponible para asignar la solicitud
      const { data: areas } = await supabase
        .from('areas')
        .select('id')
        .eq('activo', true)
        .limit(1);

      const areaId = areas?.[0]?.id || '';

      // Crear registro en la tabla de solicitudes con un tipo especial para pagos
      const { data: solicitud, error: solicitudError } = await supabase
        .from('solicitudes')
        .insert({
          titulo: `Gestión de Pago - ${formData.concepto}`,
          descripcion: `${formData.descripcion}${formData.monto ? `\n\nMonto: $${formData.monto}` : ''}`,
          area_id: areaId,
          solicitante_id: user?.id || '',
        })
        .select()
        .single();

      if (solicitudError) throw solicitudError;

      // Registrar imágenes de soporte (reutilizamos la tabla de imágenes de incidencias)
      const imagenesData = imagenes.map(img => ({
        incidencia_id: solicitud.id, // Reutilizamos este campo para almacenar el ID de la solicitud
        url_imagen: img.url,
        nombre_archivo: img.nombre,
        tipo_archivo: 'image/jpeg',
      }));

      const { error: imagenesError } = await supabase
        .from('imagenes_incidencias')
        .insert(imagenesData);

      if (imagenesError) throw imagenesError;

      toast({
        title: 'Gestión de pago creada',
        description: 'La solicitud de pago ha sido registrada exitosamente',
      });

      // Limpiar formulario
      setFormData({ descripcion: '', monto: undefined, concepto: '' });
      setImagenes([]);
      setOpen(false);
    } catch (error) {
      console.error('Error creating payment request:', error);
      toast({
        title: 'Error',
        description: 'Hubo un error al crear la solicitud de pago',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none hover:from-green-600 hover:to-emerald-700">
          <CreditCard className="w-4 h-4 mr-2" />
          Gestión de Pago
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestión de Pago</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="concepto">Concepto del Pago *</Label>
            <Input
              id="concepto"
              value={formData.concepto}
              onChange={(e) => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
              placeholder="Ej: Arancel, Matrícula, Certificado"
              required
            />
          </div>

          <div>
            <Label htmlFor="monto">Monto (Opcional)</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, monto: e.target.value ? parseFloat(e.target.value) : undefined }))}
              placeholder="0.00"
            />
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Describa detalladamente la solicitud de pago, incluyendo instrucciones específicas"
              rows={4}
              required
            />
          </div>

          {/* Sección de carga de imágenes */}
          <div>
            <Label>Documentos de Soporte *</Label>
            <div className="mt-2">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <div className="mt-4">
                  <Label htmlFor="images" className="cursor-pointer">
                    <span className="text-sm font-medium text-primary hover:text-primary/80">
                      Seleccione archivos
                    </span>
                    <input
                      id="images"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e.target.files)}
                      className="sr-only"
                      disabled={isUploading}
                    />
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG hasta 5MB cada uno
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vista previa de imágenes */}
          {imagenes.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {imagenes.map((imagen) => (
                <Card key={imagen.id} className="relative">
                  <CardContent className="p-4">
                    <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                      <img
                        src={imagen.url}
                        alt={imagen.nombre}
                        className="object-cover w-full h-full"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => removeImage(imagen.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 truncate">
                      {imagen.nombre}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {isSubmitting ? 'Creando...' : 'Crear Solicitud'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};