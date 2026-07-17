import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary only if real API keys are present
const isMock = 
  !process.env.CLOUDINARY_CLOUD_NAME || 
  process.env.CLOUDINARY_CLOUD_NAME.startsWith('mock') ||
  !process.env.CLOUDINARY_API_KEY ||
  process.env.CLOUDINARY_API_KEY.startsWith('mock');

if (!isMock) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Uploads a file (either base64 data url or path) to Cloudinary or returns a mock URL.
 * Automatically applies f_auto and q_auto optimizations.
 * @param fileContent Base64 data URI or file path
 * @param folder Cloudinary folder name
 */
export async function uploadToCloudinary(fileContent: string, folder: string = 'treckwari'): Promise<string> {
  if (isMock) {
    console.log(`[Cloudinary Mock] Simulating upload to folder: ${folder}`);
    const isVideo = fileContent.startsWith('data:video') || fileContent.endsWith('.mp4');
    
    if (isVideo) {
      return 'https://assets.mixkit.co/videos/preview/mixkit-group-of-friends-hiking-in-a-mountain-forest-40286-large.mp4';
    }

    const mockImages = [
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=800',
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?q=80&w=800',
      'https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=800',
      'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=800',
      'https://images.unsplash.com/photo-1533240332313-0db49b439ad3?q=80&w=800'
    ];
    const randomIndex = Math.floor(Math.random() * mockImages.length);
    return mockImages[randomIndex];
  }

  try {
    const isVideo = fileContent.startsWith('data:video') || fileContent.startsWith('data:octet-stream');
    const uploadResult = await cloudinary.uploader.upload(fileContent, {
      folder,
      resource_type: 'auto',
      transformation: isVideo ? undefined : [
        { fetch_format: 'auto', quality: 'auto' }
      ]
    });
    return uploadResult.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload media to Cloudinary.');
  }
}

/**
 * Extracts the public ID of a Cloudinary asset from its secure URL.
 * @param url Cloudinary secure URL
 */
export function extractPublicId(url: string): string | null {
  try {
    if (!url || !url.includes('cloudinary.com')) return null;
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    
    const remaining = parts[1];
    
    // Remove version prefix if present (e.g. "v1234567/")
    const cleanPath = remaining.replace(/^v\d+\//, '');
    
    // Remove file extension (e.g. ".jpg", ".png")
    const lastDotIndex = cleanPath.lastIndexOf('.');
    if (lastDotIndex === -1) return cleanPath;
    return cleanPath.substring(0, lastDotIndex);
  } catch (err) {
    console.error('Failed to extract Cloudinary public ID:', err);
    return null;
  }
}

/**
 * Deletes an asset from Cloudinary using its public ID.
 * @param publicId Public ID of the asset on Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  if (isMock) {
    console.log(`[Cloudinary Mock] Simulating delete of asset: ${publicId}`);
    return true;
  }
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}
