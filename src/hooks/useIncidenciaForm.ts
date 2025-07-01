
import { useState, useEffect } from "react";
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
  sala_id: string;
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
    reportado_por: "",
    sala_id: ""
  });
  
  const [imagenes, setImagenes] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Capturar automáticamente el nombre del usuario al cargar
  useEffect(() => {
    if (profile?.full_name) {
      setFormData(prev => ({ ...prev, reportado_por: profile.full_name }));
    } else if (profile?.email) {
      const emailName = profile.email.split('@')[0];
      setFormData(prev => ({ ...prev, reportado_por: emailName }));
    }
  }, [profile]);

  // Función para obtener área sugerida basada en clasificación
  const getSuggestedAreaAndPriority = async (clasificacionId: string) => {
    if (!clasificacionId) return null;
    
    try {
      const { data, error } = await supabase
        .from("clasificacion_area_mapping")
        .select(`
          area_id,
          prioridad_sugerida,
          areas (
            id,
            nombre
          )
        `)
        .eq("clasificacion_id", clasificacionId)
        .eq("activo", true)
        .limit(1)
        .single();

      if (error) {
        console.log("No hay mapeo configurado para esta clasificación");
        return null;
      }

      return {
        area_id: data.area_id,
        prioridad_sugerida: data.prioridad_sugerida
      };
    } catch (error) {
      console.error("Error getting suggested area:", error);
      return null;
    }
  };

  // Función optimizada para subir archivos a Supabase Storage
  const uploadFileToStorage = async (file: File, incidenciaId: string, index: number) => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${incidenciaId}_${Date.now()}_${index}.${fileExtension}`;
    
    console.log(`Uploading file to storage: ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from("incidencias-multimedia")
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading file:", error);
      throw error;
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from("incidencias-multimedia")
      .getPublicUrl(fileName);

    return {
      fileName,
      publicUrl: urlData.publicUrl,
      size: file.size,
      type: file.type
    };
  };

  // Función para enviar notificación
  const sendNotification = async (incidenciaData: any, areaData: any, clasificacionData: any, salaData: any) => {
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
            sala_nombre: salaData?.nombre || 'Sin sala',
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

  // Mutación optimizada para crear incidencia
  const crearIncidencia = useMutation({
    mutationFn: async (datos: FormData) => {
      console.log("Creating incidencia with data:", datos);
      
      // Verificar autenticación y permisos
      if (!user) {
        throw new Error("Debes iniciar sesión para crear incidencias");
      }
      
      if (!profile) {
        throw new Error("No se pudo cargar el perfil de usuario");
      }
      
      if (profile.role !== 'monitor' && profile.role !== 'admin') {
        throw new Error("No tienes permisos para crear incidencias. Solo monitores y administradores pueden crear incidencias.");
      }
      
      // Crear la incidencia
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
          clasificaciones(id, nombre),
          salas(id, nombre)
        `)
        .single();

      if (error) {
        console.error("Error creating incidencia:", error);
        throw new Error(`Error al crear la incidencia: ${error.message}`);
      }

      console.log("Incidencia created successfully:", incidencia);

      // Enviar notificación si es prioridad alta o crítica
      if (incidencia.prioridad === 'alta' || incidencia.prioridad === 'critica') {
        await sendNotification(incidencia, incidencia.areas, incidencia.clasificaciones, incidencia.salas);
      }

      // Subir archivos multimedia de forma optimizada
      if (imagenes.length > 0) {
        console.log("Uploading multimedia files...");
        
        const uploadPromises = imagenes.map(async (archivo, index) => {
          try {
            const uploadResult = await uploadFileToStorage(archivo, incidencia.id, index);
            
            // Guardar solo la referencia URL en la base de datos
            const { error: dbError } = await supabase
              .from("imagenes_incidencias")
              .insert({
                incidencia_id: incidencia.id,
                nombre_archivo: uploadResult.fileName,
                url_imagen: uploadResult.publicUrl,
                tipo_archivo: uploadResult.type,
                tamaño_bytes: uploadResult.size
              });

            if (dbError) {
              console.error("Error saving image reference:", dbError);
            } else {
              console.log("Image reference saved successfully");
            }
            
            return uploadResult;
          } catch (error) {
            console.error(`Error uploading file ${index}:`, error);
            return null;
          }
        });

        // Esperar a que todos los archivos se suban
        const uploadResults = await Promise.allSettled(uploadPromises);
        const successfulUploads = uploadResults.filter(result => result.status === 'fulfilled').length;
        
        console.log(`Successfully uploaded ${successfulUploads}/${imagenes.length} files`);
      }

      return incidencia;
    },
    onSuccess: (incidencia) => {
      let successMessage = "La incidencia ha sido registrada exitosamente.";
      
      if (incidencia.prioridad === 'alta' || incidencia.prioridad === 'critica') {
        successMessage += " Se ha enviado una notificación a los administradores debido a la prioridad " + incidencia.prioridad + ".";
      }
      
      if (imagenes.length > 0) {
        successMessage += ` Se han adjuntado ${imagenes.length} archivo(s) multimedia.`;
      }
      
      toast({
        title: "Incidencia creada",
        description: successMessage,
      });
      
      // Limpiar formulario pero mantener el nombre del usuario
      const nombreUsuario = formData.reportado_por;
      setFormData({
        titulo: "",
        descripcion: "",
        observaciones: "",
        area_id: "",
        clasificacion_id: "",
        prioridad: "media",
        reportado_por: nombreUsuario,
        sala_id: ""
      });
      setImagenes([]);
      setPreviewUrls([]);
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ["dashboard-estadisticas"] });
      queryClient.invalidateQueries({ queryKey: ["incidencias"] });
      queryClient.invalidateQueries({ queryKey: ["user-statistics"] });
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

  const handleInputChange = async (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Si cambió la clasificación, obtener área y prioridad sugeridas
    if (field === 'clasificacion_id' && value) {
      const suggestion = await getSuggestedAreaAndPriority(value);
      if (suggestion) {
        setFormData(prev => ({ 
          ...prev, 
          area_id: suggestion.area_id,
          prioridad: suggestion.prioridad_sugerida || prev.prioridad
        }));
        
        toast({
          title: "Sistema Inteligente",
          description: "Se ha seleccionado automáticamente el área y prioridad sugerida para este tipo de incidencia.",
        });
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const nuevasImagenes = Array.from(files);
      
      setImagenes(prev => [...prev, ...nuevasImagenes]);
      
      // Crear URLs de preview optimizadas
      nuevasImagenes.forEach(file => {
        const url = URL.createObjectURL(file);
        setPreviewUrls(prev => [...prev, url]);
      });
    }
  };

  const removeImage = (index: number) => {
    // Limpiar URL de preview para evitar memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    setImagenes(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Limpiar URLs de preview al desmontar el componente
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

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
