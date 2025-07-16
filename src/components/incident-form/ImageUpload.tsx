
import { Label } from "@/components/ui/label";
import { Upload, X, Video, Image, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { UploadedImage } from "@/utils/supabaseStorage";

interface ImageUploadProps {
  uploadedImages: UploadedImage[];
  onImageUpload: (files: FileList) => void;
  onRemoveImage: (imageId: string) => void;
  isUploading: boolean;
}

const ImageUpload = ({ uploadedImages, onImageUpload, onRemoveImage, isUploading }: ImageUploadProps) => {
  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validar que sean imágenes o videos
      const validFiles = Array.from(files).filter(file => {
        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');
        
        if (!isImage && !isVideo) {
          toast({
            title: "Archivo no válido",
            description: `${file.name} no es una imagen o video válido.`,
            variant: "destructive",
          });
          return false;
        }

        // Límite inicial de 10MB para imágenes y 2MB para videos
        const maxSize = isVideo ? 30 * 1024 * 1024 : 10 * 1024 * 1024;
        if (file.size > maxSize) {
          toast({
            title: "Archivo muy grande",
            description: `${file.name} excede ${isVideo ? '30MB' : '10MB'}.`,
            variant: "destructive",
          });
          return false;
        }
        
        return true;
      });
      
      if (validFiles.length > 0) {
        // Crear FileList con archivos válidos
        const dt = new DataTransfer();
        validFiles.forEach(file => dt.items.add(file));
        onImageUpload(dt.files);
      }
    }
    
    // Limpiar el input
    event.target.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <Label>Evidencia Multimedia (Imágenes y Videos)</Label>
      <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
        isUploading 
          ? 'border-blue-400 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
      }`}>
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          className="hidden"
          id="media-upload"
          disabled={isUploading}
        />
        <label htmlFor="media-upload" className={`cursor-pointer ${isUploading ? 'cursor-not-allowed' : ''}`}>
          {isUploading ? (
            <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
          ) : (
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          )}
          <p className="mt-2 text-sm text-gray-600">
            {isUploading ? 'Procesando archivos multimedia...' : 'Haz clic para subir imágenes y videos'}
          </p>
          <p className="text-xs text-gray-500">
            Imágenes: PNG, JPG, GIF hasta 10MB | Videos: MP4, MOV, AVI hasta 30MB
          </p>
          <p className="text-xs text-blue-600 mt-1">
            Las imágenes se comprimen automáticamente a WebP (máx. 2MB, 1024px)
          </p>
        </label>
      </div>

      {/* Preview de imágenes subidas */}
      {uploadedImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Archivos multimedia ({uploadedImages.length})
            </h4>
            <span className="text-xs text-gray-500">
              Total: {formatFileSize(uploadedImages.reduce((sum, img) => sum + img.size, 0))}
            </span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedImages.map((image) => {
              const isVideo = image.type.startsWith('video/');
              return (
                <div key={image.id} className="relative group">
                  <div className="relative">
                    {isVideo ? (
                      <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                        <div className="text-center">
                          <Video className="w-6 h-6 mx-auto text-gray-600 mb-1" />
                          <span className="text-xs text-gray-500">Video</span>
                        </div>
                      </div>
                    ) : (
                      <img
                        src={image.url}
                        alt={`Imagen ${image.fileName}`}
                        className="w-full h-24 object-cover rounded-lg"
                        loading="lazy"
                      />
                    )}
                    <div className="absolute top-1 left-1 bg-green-600 bg-opacity-80 rounded-full p-1">
                      {isVideo ? <Video className="w-3 h-3 text-white" /> : <Image className="w-3 h-3 text-white" />}
                    </div>
                    {!isVideo && (
                      <div className="absolute top-1 right-1 bg-blue-600 bg-opacity-80 rounded px-1">
                        <span className="text-xs text-white font-medium">WebP</span>
                      </div>
                    )}
                  </div>
                <button
                  type="button"
                  onClick={() => onRemoveImage(image.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </button>
                  <div className="mt-1">
                    <p className="text-xs text-gray-500 truncate" title={image.fileName}>
                      {image.fileName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(image.size)}
                    </p>
                    <p className="text-xs text-green-600">
                      Subida exitosa
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
