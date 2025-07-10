
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import { useSmartAreaSelection } from "./useSmartAreaSelection";

export interface IncidenciaData {
  titulo: string;
  descripcion: string;
  area_id: string;
  sala_id: string;
  clasificacion_id: string;
  prioridad: "baja" | "media" | "alta" | "critica";
  fecha_incidencia: string;
  observaciones: string;
  reportado_por: string;
  tiempo_minutos?: number;
}

export const useIncidenciaForm = () => {
  const { user, profile } = useAuth();
  const { logAction } = useAuditLog();
  const { getSuggestedArea } = useSmartAreaSelection();
  
  const [formData, setFormData] = useState<IncidenciaData>({
    titulo: "",
    descripcion: "",
    area_id: "",
    sala_id: "",
    clasificacion_id: "",
    prioridad: "media",
    fecha_incidencia: new Date().toISOString(),
    observaciones: "",
    reportado_por: profile?.full_name || user?.email || "",
    tiempo_minutos: undefined,
  });

  const [imagenes, setImagenes] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const handleInputChange = useCallback((field: string, value: string | number) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Si se cambia la clasificación, aplicar selección inteligente
      if (field === "clasificacion_id" && value) {
        const smartSelection = getSuggestedArea(value as string);
        if (smartSelection) {
          newData.area_id = smartSelection.areaId;
          newData.prioridad = smartSelection.prioridad as any;
        }
      }
      
      return newData;
    });
  }, [getSuggestedArea]);

  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const nuevosArchivos = Array.from(files);
      
      // Validar tamaño de archivos
      const archivosValidos = nuevosArchivos.filter(file => {
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
        
        if (file.size > maxSize) {
          toast.error(`El archivo ${file.name} excede el límite de ${isVideo ? '50MB' : '10MB'}.`);
          return false;
        }
        return true;
      });

      if (archivosValidos.length > 0) {
        setImagenes(prev => [...prev, ...archivosValidos]);
        
        // Crear URLs de preview
        archivosValidos.forEach(file => {
          const url = URL.createObjectURL(file);
          setPreviewUrls(prev => [...prev, url]);
        });
      }
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImagenes(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = prev.filter((_, i) => i !== index);
      // Revocar la URL del objeto eliminado
      URL.revokeObjectURL(prev[index]);
      return newUrls;
    });
  }, []);

  const submitIncidencia = useCallback(async (data: IncidenciaData, images: File[] = []) => {
    if (!user) {
      toast.error("Debes estar autenticado para crear una incidencia");
      return { success: false };
    }

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
        tiempo_minutos: data.tiempo_minutos,
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
      
      // Limpiar formulario
      setFormData({
        titulo: "",
        descripcion: "",
        area_id: "",
        sala_id: "",
        clasificacion_id: "",
        prioridad: "media",
        fecha_incidencia: new Date().toISOString(),
        observaciones: "",
        reportado_por: profile?.full_name || user?.email || "",
        tiempo_minutos: undefined,
      });
      setImagenes([]);
      setPreviewUrls(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });

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
    }
  }, [user, profile, logAction]);

  const crearIncidencia = useMutation({
    mutationFn: () => submitIncidencia(formData, imagenes),
    onSuccess: (result) => {
      if (result.success) {
        console.log('Incidencia creada exitosamente');
      }
    },
    onError: (error) => {
      console.error('Error en mutación:', error);
    }
  });

  return {
    formData,
    imagenes,
    previewUrls,
    handleInputChange,
    handleImageUpload,
    removeImage,
    submitIncidencia,
    crearIncidencia,
    user,
    profile,
    isSubmitting: crearIncidencia.isPending
  };
};
