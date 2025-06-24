
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  imagenes: File[];
  previewUrls: string[];
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
}

const ImageUpload = ({ imagenes, previewUrls, onImageUpload, onRemoveImage }: ImageUploadProps) => {
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const nuevasImagenes = Array.from(files);
      
      // Validar tamaño de archivos (max 10MB cada uno)
      const archivosValidos = nuevasImagenes.filter(file => {
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "Archivo muy grande",
            description: `El archivo ${file.name} excede el límite de 10MB.`,
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

  return (
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
          <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB cada una</p>
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
                onClick={() => onRemoveImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
