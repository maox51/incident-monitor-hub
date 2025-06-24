
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface FormData {
  titulo: string;
  descripcion: string;
  observaciones: string;
  area_id: string;
  clasificacion_id: string;
  prioridad: string;
  reportado_por: string;
}

export const useIncidenciaForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();
  
  const [formData, setFormData] = useState<FormData>({
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

  // Función para enviar notificación
  const sendNotification = async (incidenciaData: any, areaData: any, clasificacionData: any) => {
    try {
      console.log("Attempting to send notification for priority:", incidenciaData.prioridad);
      
      if (incidenciaData.prioridad === 'alta' || incidenciaData.prioridad === 'critica') {
        const { data, error } = await supabase.functions.invoke('send-notification', {
          body: {
            incidencia_id: incidenciaData.id,
            titulo: incidenciaData.titulo,
            descripcion: incidenciaData.descripcion,
            prioridad: incidenciaData.prioridad,
            area_nombre: areaData?.nombre || 'Sin área',
            clasificacion_nombre: clasificacionData?.nombre || 'Sin clasificación',
            reportado_por: incidenciaData.reportado_por
          }
        });

        if (error) {
          console.error("Error sending notification:", error);
        } else {
          console.log("Notification sent successfully:", data);
        }
      }
    } catch (error) {
      console.error("Error in sendNotification:", error);
    }
  };

  // Mutación para crear incidencia
  const crearIncidencia = useMutation({
    mutationFn: async (datos: FormData) => {
      console.log("Creating incidencia with data:", datos);
      console.log("Current user:", user?.id);
      console.log("User profile:", profile);
      
      // Verificar autenticación y permisos antes de intentar crear
      if (!user) {
        throw new Error("Debes iniciar sesión para crear incidencias");
      }
      
      if (!profile) {
        throw new Error("No se pudo cargar el perfil de usuario");
      }
      
      if (profile.role !== 'monitor' && profile.role !== 'admin') {
        throw new Error("No tienes permisos para crear incidencias. Solo monitores y administradores pueden crear incidencias.");
      }
      
      // Crear la incidencia con fecha actual y verificación de permisos
      const incidenciaData = {
        ...datos,
        fecha_incidencia: new Date().toISOString()
      };
      
      console.log("Attempting to insert incidencia:", incidenciaData);
      
      const { data: incidencia, error } = await supabase
        .from("incidencias")
        .insert([incidenciaData])
        .select(`
          *,
          areas(id, nombre),
          clasificaciones(id, nombre)
        `)
        .single();

      if (error) {
        console.error("Error creating incidencia:", error);
        throw new Error(`Error al crear la incidencia: ${error.message}`);
      }

      console.log("Incidencia created successfully:", incidencia);

      // Enviar notificación si es prioridad alta o crítica
      if (incidencia.prioridad === 'alta' || incidencia.prioridad === 'critica') {
        await sendNotification(incidencia, incidencia.areas, incidencia.clasificaciones);
      }

      // Subir imágenes si las hay
      if (imagenes.length > 0) {
        console.log("Uploading images...");
        
        for (let i = 0; i < imagenes.length; i++) {
          const archivo = imagenes[i];
          const nombreArchivo = `${incidencia.id}_${Date.now()}_${i}_${archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          console.log(`Uploading image ${i + 1}/${imagenes.length}:`, nombreArchivo);
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("incidencias-images")
            .upload(nombreArchivo, archivo, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            continue;
          }

          console.log("Image uploaded successfully:", uploadData);

          // Obtener URL pública
          const { data: urlData } = supabase.storage
            .from("incidencias-images")
            .getPublicUrl(nombreArchivo);

          console.log("Public URL:", urlData.publicUrl);

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
          } else {
            console.log("Image reference saved successfully");
          }
        }
      }

      return incidencia;
    },
    onSuccess: (incidencia) => {
      let successMessage = "La incidencia ha sido registrada exitosamente.";
      
      if (incidencia.prioridad === 'alta' || incidencia.prioridad === 'critica') {
        successMessage += " Se ha enviado una notificación a los administradores debido a la prioridad " + incidencia.prioridad + ".";
      }
      
      toast({
        title: "Incidencia creada",
        description: successMessage,
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
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["dashboard-estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["incidencias"] });
    },
    onError: (error: any) => {
      console.error("Error creating incidencia:", error);
      
      let errorMessage = "Hubo un error al crear la incidencia. Por favor intenta de nuevo.";
      
      if (error.message?.includes("row-level security")) {
        errorMessage = "Error de permisos: No puedes crear incidencias. Contacta al administrador.";
      } else if (error.message?.includes("not authenticated")) {
        errorMessage = "Debes iniciar sesión para crear incidencias.";
      } else if (error.message?.includes("No tienes permisos")) {
        errorMessage = error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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

  return {
    formData,
    imagenes,
    previewUrls,
    crearIncidencia,
    handleInputChange,
    handleImageUpload,
    removeImage,
    user,
    profile
  };
};
