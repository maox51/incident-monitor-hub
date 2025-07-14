
import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useAuditLog } from "./useAuditLog";
import { toast } from "sonner";
import { useSmartAreaSelection } from "./useSmartAreaSelection";
import { compressImageToWebP, getFullFilePath } from "@/utils/imageCompression";
import { uploadImageToStorage, deleteImageFromStorage, saveImageRecord, deleteImageRecord, UploadedImage } from "@/utils/supabaseStorage";

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

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);

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

  const handleImageUpload = useCallback(async (files: FileList) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        try {
          // Comprimir imagen a WebP
          const compressedFile = await compressImageToWebP(file);
          
          // Generar ruta del archivo
          const filePath = getFullFilePath(formData.titulo || 'sin_titulo', compressedFile.name);
          
          // Subir a Supabase Storage
          const uploadedImage = await uploadImageToStorage(compressedFile, filePath);
          
          // Log de auditoría
          await logAction('compress_and_upload_image', 'incident_image', null, {
            originalSize: file.size,
            compressedSize: compressedFile.size,
            originalName: file.name,
            compressedName: compressedFile.name,
            filePath,
            timestamp: new Date().toISOString()
          });
          
          return uploadedImage;
        } catch (error) {
          console.error(`Error procesando ${file.name}:`, error);
          toast.error(`Error procesando ${file.name}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          return null;
        }
      });
      
      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter((result): result is UploadedImage => result !== null);
      
      if (successfulUploads.length > 0) {
        setUploadedImages(prev => [...prev, ...successfulUploads]);
        toast.success(`${successfulUploads.length} imagen(es) subida(s) exitosamente`);
      }
      
    } catch (error) {
      console.error('Error en handleImageUpload:', error);
      toast.error('Error procesando las imágenes');
    } finally {
      setIsUploading(false);
    }
  }, [formData.titulo, logAction]);

  const removeImage = useCallback(async (imageId: string) => {
    const imageToRemove = uploadedImages.find(img => img.id === imageId);
    if (!imageToRemove) return;
    
    try {
      // Eliminar del storage
      await deleteImageFromStorage(imageToRemove.path);
      
      // Actualizar estado
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      
      // Log de auditoría
      await logAction('delete_uploaded_image', 'incident_image', null, {
        imageId,
        fileName: imageToRemove.fileName,
        path: imageToRemove.path,
        timestamp: new Date().toISOString()
      });
      
      toast.success('Imagen eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando imagen:', error);
      toast.error('Error eliminando la imagen');
    }
  }, [uploadedImages, logAction]);

  const submitIncidencia = useCallback(async (data: IncidenciaData) => {
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
        images_count: uploadedImages.length,
        timestamp: new Date().toISOString()
      });

      // Guardar registros de imágenes en la base de datos
      if (uploadedImages.length > 0) {
        const imageRecordPromises = uploadedImages.map(async (image) => {
          await saveImageRecord(incidencia.id, image);
          
          // Log individual por imagen
          await logAction('link_image_to_incident', 'incident_image', incidencia.id, {
            imageId: image.id,
            fileName: image.fileName,
            fileSize: image.size,
            timestamp: new Date().toISOString()
          });
        });

        await Promise.all(imageRecordPromises);
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
      setUploadedImages([]);

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
  }, [user, profile, uploadedImages, logAction]);

  const crearIncidencia = useMutation({
    mutationFn: () => submitIncidencia(formData),
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
    uploadedImages,
    isUploading,
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
