import imageCompression from 'browser-image-compression';

/**
 * Aggressively compresses an image to get close to a target size (e.g., 5-10KB)
 * for storage efficiency.
 */
export async function compressImage(file: File, maxSizeKB: number = 10): Promise<File> {
  const options = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight: 500, // Reduced from 1024 to save space
    useWebWorker: true,
    initialQuality: 0.3, // Lower initial quality for smaller size
  };
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Compression error:', error);
    return file;
  }
}

/**
 * Aggressive base64 compression using Canvas
 */
export async function compressBase64(base64Str: string, maxWidth = 300, maxHeight = 300, quality = 0.3): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Aggressive JPEG compression to reach target size
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
