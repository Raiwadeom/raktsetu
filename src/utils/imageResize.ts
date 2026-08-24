import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { File } from 'expo-file-system';

const TARGET_MAX_BYTES = 300 * 1024;
// 80% down to a 40% floor — low enough to comfortably clear 300KB on large
// photos, but not so low that ID card text/photo becomes unreadable.
const QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.4];

export interface ResizedImage {
  uri: string;
  width: number;
  height: number;
  sizeBytes: number;
}

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject);
  });
}

/**
 * Downscales + iteratively compresses a picked image before it ever hits the
 * network. Modern phone cameras produce 8-12+ MB originals; uploading those
 * directly to Cloudinary is what made profile/ID uploads feel slow. This
 * caps the longest side at `maxDimension` (without upscaling smaller
 * images), then steps JPEG quality down through `QUALITY_STEPS` until the
 * result is under `TARGET_MAX_BYTES` or the quality floor is reached.
 */
export async function resizeImageForUpload(uri: string, maxDimension = 1280): Promise<ResizedImage> {
  const { width, height } = await getImageSize(uri);

  let context = ImageManipulator.manipulate(uri);
  if (Math.max(width, height) > maxDimension) {
    context = width >= height
      ? context.resize({ width: maxDimension })
      : context.resize({ height: maxDimension });
  }
  const rendered = await context.renderAsync();

  let result: { uri: string; width: number; height: number } | null = null;
  let sizeBytes = 0;
  for (const quality of QUALITY_STEPS) {
    result = await rendered.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    sizeBytes = new File(result.uri).size;
    if (sizeBytes <= TARGET_MAX_BYTES) break;
  }

  return { uri: result!.uri, width: result!.width, height: result!.height, sizeBytes };
}
