import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../constants/cloudinaryConfig';

interface UploadParams {
  uri: string;
  name: string;
  mimeType?: string | null;
  onProgress?: (progress: number) => void;
}

interface UploadIdCardParams extends UploadParams {
  extension?: string;
}

/**
 * Uploads a picked file to Cloudinary's unsigned upload API. PDFs go
 * through the `raw` resource type since Cloudinary doesn't treat them as
 * images. Uses XMLHttpRequest (not fetch) because only XHR exposes real
 * upload-progress events in React Native.
 */
function uploadToCloudinary({
  uri,
  name,
  mimeType,
  resourceType,
  onProgress,
}: UploadParams & { resourceType: 'image' | 'raw' }): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

    const formData = new FormData();
    // React Native's FormData accepts this { uri, name, type } file shape,
    // which doesn't match the DOM lib's Blob-only typing — hence the cast.
    formData.append('file', { uri, name, type: mimeType || 'application/octet-stream' } as unknown as Blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status === 200 && data.secure_url) {
          onProgress?.(1);
          resolve(data.secure_url as string);
        } else {
          reject(new Error(data?.error?.message || `Upload failed (HTTP ${xhr.status})`));
        }
      } catch {
        reject(new Error('Upload succeeded but the response could not be read.'));
      }
    };

    xhr.onerror = () => reject(new Error('No internet connection. Please try again.'));

    xhr.send(formData);
  });
}

export function uploadIdCard({ uri, name, mimeType, extension, onProgress }: UploadIdCardParams): Promise<string> {
  const resourceType: 'image' | 'raw' = (extension || '').toLowerCase() === 'pdf' ? 'raw' : 'image';
  return uploadToCloudinary({ uri, name, mimeType, resourceType, onProgress });
}

export function uploadProfilePhoto({ uri, name, mimeType, onProgress }: UploadParams): Promise<string> {
  return uploadToCloudinary({ uri, name, mimeType, resourceType: 'image', onProgress });
}
