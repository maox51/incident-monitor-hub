import imageCompression from 'browser-image-compression';

interface CompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType: string;
}

/**
 * Comprime una imagen a formato WebP con límites específicos
 */
export const compressImageToWebP = async (file: File): Promise<File> => {
  const options: CompressionOptions = {
    maxSizeMB: 2, // Límite de 2MB
    maxWidthOrHeight: 1024, // Ancho máximo de 1024px
    useWebWorker: true,
    fileType: 'image/webp'
  };

  try {
    const compressedFile = await imageCompression(file, options);
    
    // Crear un nuevo archivo con nombre actualizado para WebP
    const webpFileName = file.name.replace(/\.[^/.]+$/, '.webp');
    const webpFile = new File([compressedFile], webpFileName, {
      type: 'image/webp',
      lastModified: Date.now()
    });

    console.log(`Imagen comprimida: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) → ${webpFile.name} (${(webpFile.size / 1024 / 1024).toFixed(2)}MB)`);
    
    return webpFile;
  } catch (error) {
    console.error('Error comprimiendo imagen:', error);
    throw new Error('No se pudo comprimir la imagen');
  }
};

/**
 * Genera el nombre del archivo basado en la incidencia y fecha
 */
export const generateFileName = (incidenciaTitulo: string, originalName: string): string => {
  const now = new Date();
  const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const timestamp = now.getTime();
  
  // Sanitizar el título de la incidencia
  const tituloSanitizado = incidenciaTitulo
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 30); // Limitar longitud
  
  const extension = originalName.split('.').pop() || 'webp';
  
  return `incidencia_${tituloSanitizado}_${fecha}_${timestamp}.${extension}`;
};

/**
 * Genera la estructura de carpetas por año/mes
 */
export const generateFolderPath = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.toLocaleDateString('es-ES', { month: 'long' });
  
  return `${year}/${month}`;
};

/**
 * Obtiene la ruta completa del archivo en el bucket
 */
export const getFullFilePath = (incidenciaTitulo: string, originalName: string): string => {
  const folderPath = generateFolderPath();
  const fileName = generateFileName(incidenciaTitulo, originalName);
  
  return `${folderPath}/${fileName}`;
};