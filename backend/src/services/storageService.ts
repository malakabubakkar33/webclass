import fs from 'fs';
import path from 'path';
import { getSupabase } from '../config/supabase.js';
import { ENV } from '../config/env.js';

export class StorageService {
  /**
   * Upload Buffer directly to Supabase Storage with local fallback
   */
  public static async uploadBuffer(
    bucket: 'avatars' | 'course-thumbnails' | 'course-videos' | 'assignments',
    buffer: Buffer,
    destinationPath: string,
    mimeType: string
  ): Promise<{ url: string; storagePath: string }> {
    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(destinationPath, buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!error && data) {
          const { data: publicUrlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(destinationPath);

          console.log(`[StorageService] Uploaded to Supabase bucket "${bucket}": ${publicUrlData.publicUrl}`);
          return {
            url: publicUrlData.publicUrl,
            storagePath: `${bucket}/${destinationPath}`,
          };
        }

        if (error) {
          console.warn(`[StorageService] Supabase upload failed for ${destinationPath}:`, error.message);
        }
      } catch (err) {
        console.error('[StorageService] Error during Supabase upload:', err);
      }
    }

    // Local disk fallback (only for persistent local dev environments, NEVER for Vercel serverless)
    const isVercel = Boolean(process.env.VERCEL);
    if (!isVercel) {
      try {
        const rootDir = path.resolve(process.cwd(), 'uploads');
        const dirPath = path.join(rootDir, bucket);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        const localFilePath = path.join(dirPath, destinationPath);
        fs.writeFileSync(localFilePath, buffer);
        
        const localUrl = `/uploads/${bucket}/${destinationPath}`;
        return {
          url: localUrl,
          storagePath: `local/${bucket}/${destinationPath}`,
        };
      } catch (localErr) {
        console.warn('[StorageService] Local disk write fallback failed, using inline Data URI:', localErr);
      }
    }

    // Final resilient fallback: Base64 Data URI so the image NEVER fails or disappears on serverless
    const base64 = buffer.toString('base64');
    return {
      url: `data:${mimeType};base64,${base64}`,
      storagePath: `inline/${bucket}/${destinationPath}`,
    };
  }

  /**
   * Upload file from local filesystem path
   */
  public static async uploadFile(
    bucket: 'avatars' | 'course-thumbnails' | 'course-videos' | 'assignments',
    localFilePath: string,
    destinationPath: string,
    mimeType: string
  ): Promise<{ url: string; storagePath: string }> {
    try {
      const buffer = fs.readFileSync(localFilePath);
      return this.uploadBuffer(bucket, buffer, destinationPath, mimeType);
    } catch (err: any) {
      console.error('[StorageService] Failed to read local file for upload:', err);
      const fileName = path.basename(localFilePath);
      return {
        url: `/uploads/${bucket}/${fileName}`,
        storagePath: `local/${bucket}/${fileName}`,
      };
    }
  }
}
