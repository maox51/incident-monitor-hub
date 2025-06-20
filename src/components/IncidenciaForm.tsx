
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Image as ImageIcon } from "lucide-react";

const IncidenciaForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    observaciones: "",
    area_id: "",
    clasificacion_id: "",
    prioridad: "media",
    reportado_por: ""
  });
  
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Obtener áreas
  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data } = await supabase
        .from("areas")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
  });

  // Obtener clasificaciones
  const { data: clasificaciones } = useQuery({
    queryKey: ["clasificaciones"],
    queryFn: async () => {
      const { data } = await supabase
        .from("clasificaciones")
        .select("*")
        .eq("activo", true)
        .order("nombre");
      return data || [];
    },
  });

  // Mutación para crear incidencia
  const crearIncidencia = useMutation({
    mutationFn: async (datos: any) => {
      console.log("Creating incidencia with data:", datos);
      
      // Crear la incidencia
      const { data: incidencia, error } = await supabase
        .from("incidencias")
        .insert([datos])
        .select()
        .single();

      if (error) {
        console.error("Error creating incidencia:", error);
        throw error;
      }

      console.log("Incidencia created:", incidencia);

      // Subir imágenes si las hay
      if (imagenes.length > 0) {
        console.log("Uploading images...");
        for (let i = 0; i < imagenes.length; i++) {
          const archivo = imagenes[i];
          const nombreArchivo = `${incidencia.id}_${Date.now()}_${archivo.name}`;
          
          const { error: uploadError } = await supabase.storage
            .from("incidencias-images")
            .upload(nombreArchivo, archivo);

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            throw uploadError;
          }

          // Obtener URL pública
          const { data: urlData } = supabase.storage
            .from("incidencias-images")
            .getPublicUrl(nombreArchivo);

          // Guardar referencia en la base de datos
          const { error: dbError } = await supabase
            .from("imagenes_incidencias")
            .insert({
              incidencia_id: incidencia.id,
              nombre_archivo: nombreArchivo,
              url_imagen: urlData.publicUrl,
              tipo_archivo: archivo.type,
              tamaño_bytes: archivo.size
            });

          if (dbError) {
            console.error("Error saving image reference:", dbError);
            throw dbError;
          }
        }
      }

      return incidencia;
    },
    onSuccess: () => {
      toast({
        title: "Incidencia creada",
        description: "La incidencia ha sido registrada exitosamente.",
      });
      
      // Limpiar formulario
      setFormData({
        titulo: "",
        descripcion: "",
        observaciones: "",
        area_id: "",
        clasificacion_id: "",
        prioridad: "media",
        reportado_por: ""
      });
      setImagenes([]);
      setPreviewUrls([]);
      
      // Actualizar cache
      queryClient.invalidateQueries({ queryKey: ["dashboard-estadisticas"] });
    },
    onError: (error) => {
      console.error("Error creating incidencia:", error);
      toast({
        title: "Error",
        description: "Hubo un error al crear la incidencia. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const nuevasImagenes = Array.from(files);
      setImagenes(prev => [...prev, ...nuevasImagenes]);
      
      // Crear URLs de preview
      nuevasImagenes.forEach(file => {
        const url = URL.createObjectURL(file);
        setPreviewUrls(prev => [...prev, url]);
      });
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setImagenes(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.descripcion || !formData.area_id || 
        !formData.clasificacion_id || !formData.reportado_por) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    crearIncidencia.mutate(formData);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Nueva Incidencia</CardTitle>
        <CardDescription>
          Completa el formulario para registrar una nueva incidencia en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => handleInputChange("titulo", e.target.value)}
                placeholder="Título descriptivo de la incidencia"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reportado_por">Reportado por *</Label>
              <Input
                id="reportado_por"
                value={formData.reportado_por}
                onChange={(e) => handleInputChange("reportado_por", e.target.value)}
                placeholder="Nombre del reportante"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="area">Área *</Label>
              <Select value={formData.area_id} onValueChange={(value) => handleInputChange("area_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clasificacion">Clasificación *</Label>
              <Select value={formData.clasificacion_id} onValueChange={(value) => handleInputChange("clasificacion_id", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una clasificación" />
                </SelectTrigger>
                <SelectContent>
                  {clasificaciones?.map((clasificacion) => (
                    <SelectItem key={clasificacion.id} value={clasificacion.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: clasificacion.color }}
                        />
                        {clasificacion.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select value={formData.prioridad} onValueChange={(value) => handleInputChange("prioridad", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Textarea
              id="descripcion"
              value={formData.descripcion}
              onChange={(e) => handleInputChange("descripcion", e.target.value)}
              placeholder="Describe detalladamente la incidencia"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={formData.observaciones}
              onChange={(e) => handleInputChange("observaciones", e.target.value)}
              placeholder="Observaciones adicionales (opcional)"
              rows={3}
            />
          </div>

          {/* Subida de imágenes */}
          <div className="space-y-4">
            <Label>Imágenes</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Haz clic para subir imágenes o arrastra y suelta
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
              </label>
            </div>

            {/* Preview de imágenes */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={crearIncidencia.isPending}
          >
            {crearIncidencia.isPending ? "Creando..." : "Registrar Incidencia"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default IncidenciaForm;
