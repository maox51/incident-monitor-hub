
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";

export interface IncidenciaData {
  titulo: string;
  descripcion: string;
  area_id: string;
  sala_id: string;
  clasificacion_id: string;
  prioridad: "baja" | "media" | "alta" | "critica";
  fecha_incidencia: string;
  observaciones?: string;
}

export const useIncidenciaForm = () => {
  const { user } = useAuth();
  const { logAction } = useAuditLog();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitIncidencia = useCallback(async (data: IncidenciaData, images: File[] = []) => {
    if (!user) {
      toast.error("Debes estar autenticado para crear una incidencia");
      return { success: false };
    }

    setIsSubmitting(true);

    try {
      // Crear la incidencia
      const incidenciaData = {
        ...data,
        reportado_por: user.id,
      };

      const { data: incidencia, error: incidenciaError } = await supabase
        .from("incidencias")
        .insert(incidenciaData)
        .select()
        .single();

      if (incidenciaError) {
        console.error("Error creating incidencia:", incidenciaError);
        toast.error("Error al crear la incidencia: " + incidenciaError.message);
        return { success: false };
      }

      // Registrar acción de auditoría
      await logAction('create_incident', 'incident', incidencia.id, {
        titulo: data.titulo,
        prioridad: data.prioridad,
        area_id: data.area_id,
        clasificacion_id: data.clasificacion_id,
        timestamp: new Date().toISOString()
      });

      // Subir imágenes si las hay
      if (images.length > 0) {
        const uploadPromises = images.map(async (file) => {
          const fileExt = file.name.split('.').pop();
          const fileName = `${incidencia.id}/${Date.now()}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('incidencias-multimedia')
            .upload(fileName, file);

          if (uploadError) {
            console.error("Error uploading image:", uploadError);
            return null;
          }

          const { data: urlData } = supabase.storage
            .from('incidencias-multimedia')
            .getPublicUrl(fileName);

          const { error: imageRecordError } = await supabase
            .from('imagenes_incidencias')
            .insert({
              incidencia_id: incidencia.id,
              url_imagen: urlData.publicUrl,
              nombre_archivo: file.name,
              tipo_archivo: file.type,
              tamaño_bytes: file.size
            });

          if (imageRecordError) {
            console.error("Error saving image record:", imageRecordError);
          }

          // Registrar subida de imagen
          await logAction('upload_image', 'incident_image', incidencia.id, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            timestamp: new Date().toISOString()
          });

          return uploadData;
        });

        await Promise.all(uploadPromises);
      }

      toast.success("Incidencia creada exitosamente");
      return { success: true, data: incidencia };

    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Error inesperado al crear la incidencia");
      
      // Registrar error en auditoría
      await logAction('create_incident_failed', 'incident', null, {
        error: error instanceof Error ? error.message : 'Unknown error',
        incidenciaData: data,
        timestamp: new Date().toISOString()
      });
      
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  }, [user, logAction]);

  return {
    submitIncidencia,
    isSubmitting
  };
};
