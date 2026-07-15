import { apiClient } from './api';

export const storageService = {
  /**
   * Uploads an image from a local URI to the FastAPI backend.
   *
   * @param localUri The local file URI (e.g. file:///...)
   * @returns The public Cloudinary secure_url returned by the backend
   */
  async uploadDocumentImage(localUri: string): Promise<string> {
    if (!localUri) throw new Error('Local URI is required to upload an image.');

    try {
      console.log(`[StorageService] Uploading image to Backend...`);
      const response = await apiClient.uploadImageToBackend(localUri);
      
      console.log(`[StorageService] Upload complete. URL: ${response.secure_url}`);
      return response.secure_url;
    } catch (error) {
      console.error('[StorageService] Upload error:', error);
      throw error;
    }
  },

  /**
   * Note: Documents and their images are now securely deleted together
   * via the DELETE /api/v1/documents/{id} endpoint.
   * This standalone method is deprecated.
   */
  async deleteDocumentImage(downloadUrl: string): Promise<void> {
    console.log('[StorageService] Standalone image deletion is deprecated.');
    console.log('[StorageService] Image is deleted alongside the document via backend.');
    return Promise.resolve();
  }
};
