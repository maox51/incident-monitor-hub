
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useIncidenciaForm } from "@/hooks/useIncidenciaForm";
import IncidentFormFields from "@/components/incident-form/IncidentFormFields";
import ImageUpload from "@/components/incident-form/ImageUpload";

const IncidenciaForm = () => {
  const { toast } = useToast();
  const {
    formData,
    imagenes,
    previewUrls,
    crearIncidencia,
    handleInputChange,
    handleImageUpload,
    removeImage,
    user,
    profile
  } = useIncidenciaForm();

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo.trim() || !formData.descripcion.trim() || !formData.area_id || 
        !formData.clasificacion_id || !formData.reportado_por.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    // Verificar autenticación antes de enviar
    if (!user || !profile) {
      toast({
        title: "Error de autenticación",
        description: "Debes iniciar sesión para crear incidencias.",
        variant: "destructive",
      });
      return;
    }

    if (profile.role !== 'monitor' && profile.role !== 'admin') {
      toast({
        title: "Sin permisos",
        description: "Solo monitores y administradores pueden crear incidencias.",
        variant: "destructive",
      });
      return;
    }

    crearIncidencia.mutate(formData);
  };

  // Mostrar mensaje si el usuario no tiene permisos
  if (!user || !profile) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Acceso Restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Debes iniciar sesión para crear incidencias.</p>
        </CardContent>
      </Card>
    );
  }

  if (profile.role !== 'monitor' && profile.role !== 'admin') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Acceso Restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No tienes permisos para crear incidencias. Solo los monitores y administradores pueden crear incidencias.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Registrar Nueva Incidencia</CardTitle>
        <CardDescription>
          Completa el formulario para registrar una nueva incidencia en el sistema de monitoreo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <IncidentFormFields
            formData={formData}
            areas={areas}
            clasificaciones={clasificaciones}
            onInputChange={handleInputChange}
          />

          <ImageUpload
            imagenes={imagenes}
            previewUrls={previewUrls}
            onImageUpload={handleImageUpload}
            onRemoveImage={removeImage}
          />

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
