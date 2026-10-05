import https from 'https';
import { ENV } from '../config/env.js';

export interface BunnyVideoLibrary {
  Id: number;
  Name: string;
  ApiKey?: string;
  ReadOnlyApiKey?: string;
  PullZoneId?: number;
}

export interface BunnyStorageZone {
  Id: number;
  Name: string;
  StorageHostname?: string;
}

export class BunnyService {
  private static apiKey = ENV.BUNNY_API_KEY;

  private static request<T>(path: string, method: string = 'GET', body?: any): Promise<{ success: boolean; data?: T; status: number; message?: string }> {
    return new Promise((resolve) => {
      const payload = body ? JSON.stringify(body) : null;
      const options: https.RequestOptions = {
        hostname: 'api.bunny.net',
        path,
        method,
        headers: {
          AccessKey: BunnyService.apiKey,
          Accept: 'application/json',
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      };

      const req = https.request(options, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = raw ? JSON.parse(raw) : null;
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, data: parsed, status: res.statusCode });
            } else {
              resolve({
                success: false,
                status: res.statusCode || 500,
                message: parsed?.Message || parsed?.ErrorKey || `Bunny API Error (${res.statusCode})`,
                data: parsed,
              });
            }
          } catch (e: any) {
            resolve({
              success: false,
              status: res.statusCode || 500,
              message: 'Failed to parse Bunny API response: ' + raw.slice(0, 100),
            });
          }
        });
      });

      req.on('error', (err) => {
        resolve({ success: false, status: 500, message: err.message });
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  }

  /**
   * Get Bunny.net overall account / platform status
   */
  public static async getStatus() {
    const [libRes, storageRes] = await Promise.all([
      BunnyService.request<BunnyVideoLibrary[]>('/videolibrary'),
      BunnyService.request<BunnyStorageZone[]>('/storagezone'),
    ]);

    return {
      configured: Boolean(BunnyService.apiKey),
      apiKeyMasked: BunnyService.apiKey
        ? `${BunnyService.apiKey.slice(0, 8)}...${BunnyService.apiKey.slice(-8)}`
        : null,
      libraries: libRes.success ? libRes.data || [] : [],
      storageZones: storageRes.success ? storageRes.data || [] : [],
      errors: {
        libraryError: libRes.success ? null : libRes.message,
        storageError: storageRes.success ? null : storageRes.message,
      },
    };
  }

  /**
   * Attempt creating a video library if balance is active
   */
  public static async createLibrary(name: string) {
    return BunnyService.request<BunnyVideoLibrary>('/videolibrary', 'POST', { Name: name });
  }

  /**
   * Format Bunny Stream embed URL
   */
  public static formatEmbedUrl(libraryId: number | string, videoId: string): string {
    return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}`;
  }
}
