import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Comprime una imagen y la convierte a WebP usando HTML Canvas
 * @param {File} file Archivo original
 * @param {number} maxWidth Ancho máximo (por defecto 800px)
 * @param {number} quality Calidad del 0 al 1 (por defecto 0.8)
 * @returns {Promise<Blob>} Blob en formato image/webp
 */
const compressImageToWebP = (file, maxWidth = 800, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calcular nuevas dimensiones manteniendo la proporción
        if (width > maxWidth) {
          height = (maxWidth * height) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to Blob failed'));
            }
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Sube una imagen a Firebase Storage tras comprimirla a WebP
 * @param {File} file Archivo a subir
 * @param {string} path Carpeta destino (ej: 'products/')
 * @returns {Promise<string>} URL de descarga pública
 */
export const uploadImage = async (file, path = 'products') => {
  try {
    // 1. Comprimir la imagen a WebP
    const webpBlob = await compressImageToWebP(file);
    
    // 2. Generar nombre de archivo único (timestamp + aleatorio)
    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.webp`;
    const fullPath = `${path}/${uniqueName}`;
    
    // 3. Crear referencia en Storage
    const storageRef = ref(storage, fullPath);
    
    // 4. Subir el blob
    await uploadBytes(storageRef, webpBlob, { contentType: 'image/webp' });
    
    // 5. Obtener y retornar la URL pública
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error al subir la imagen:", error);
    throw error;
  }
};
