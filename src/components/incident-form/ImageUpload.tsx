
import { Label } from "@/components/ui/label";
import { Upload, X, Video, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  imagenes: File[];
  previewUrls: string[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ImageUpload = ({ imagenes, previewUrls, onImageUpload, onRemoveImage }: ImageUploadProps) => {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const nuevosArchivos = Array.from(files);
      
      // Validar tamaño de archivos (max 50MB para videos, 10MB para imágenes)
      const archivosValidos = nuevosArchivos.filter(file => {
        const isVideo = file.type.startsWith('video/');
        const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB para videos, 10MB para imágenes
        
        if (file.size > maxSize) {
          toast({
            title: "Archivo muy grande",
            description: `El archivo ${file.name} excede el límite de ${isVideo ? '50MB' : '10MB'}.`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });
      
      if (archivosValidos.length > 0) {
        onImageUpload(event);
      }
    }
  };

  const isVideoFile = (file: File) => {
    return file.type.startsWith('video/');
  };

  return (
    <div className="space-y-4">
      <Label>Archivos Multimedia</Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
          id="media-upload"
        />
        <label htmlFor="media-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            Haz clic para subir imágenes o videos
          </p>
          <p className="text-xs text-gray-500">
            Imágenes: PNG, JPG, GIF hasta 10MB | Videos: MP4, MOV, AVI hasta 50MB
          </p>
        </label>
      </div>

      {/* Preview de archivos */}
      {previewUrls.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {previewUrls.map((url, index) => (
            <div key={index} className="relative">
              {isVideoFile(imagenes[index]) ? (
                <div className="relative">
                  <video
                    src={url}
                    className="w-full h-24 object-cover rounded-lg"
                    controls
                    preload="metadata"
                  />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 rounded-full p-1">
                    <Video className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={url}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-50 rounded-full p-1">
                    <Image className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-xs text-gray-500 mt-1 truncate">
                {imagenes[index]?.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
