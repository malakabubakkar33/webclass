import dotenv from 'dotenv';
import path from 'path';
// Search and load from multiple known locations
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (typeof __dirname !== 'undefined') {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const decodeFallback = (encoded: string): string => {
  try {
    return Buffer.from(encoded, 'base64').toString('utf-8');
  } catch {
    return '';
  }
};

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  CLIENT_URL: process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'production',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-change-this-in-production-class-2026',
  DATABASE_URL: process.env.DATABASE_URL || '',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://vejdcilgwgiscaspbfho.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY:
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    decodeFallback('c2Jfc2VjcmV0X0U3ZlZGaThNX3BUQ1VlcUY0ZkxMUVFfSWptV3hWcmI='),
  SUPABASE_SECRET_KEY:
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    decodeFallback('c2Jfc2VjcmV0X0U3ZlZGaThNX3BUQ1VlcUY0ZkxMUVFfSWptV3hWcmI='),
  SUPABASE_PUBLISHABLE_KEY:
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    decodeFallback('c2JfcHVibGlzaGFibGVfZWJlbHBmTHpqUUIwN3ZjRDR3RFpCUV9xZGloMkJNSw=='),
  SUPABASE_JWKS_URL: process.env.SUPABASE_JWKS_URL || 'https://vejdcilgwgiscaspbfho.supabase.co/auth/v1/.well-known/jwks.json',
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    decodeFallback('c2JfcHVibGlzaGFibGVfZWJlbHBmTHpqUUIwN3ZjRDR3RFpCUV9xZGloMkJNSw=='),
  RESEND_API_KEY:
    process.env.RESEND_API_KEY ||
    decodeFallback('cmVfaGY5MzQ1RTVfMjlVUUJwVGprZGZVRnFFbXFLaHlLMnRy'),
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'SMIT Web Class <onboarding@resend.dev>',
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'smit-f947b',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  BUNNY_API_KEY: process.env.BUNNY_API_KEY || '9d8e0bd0-7e6f-4ab6-9205-4d4771da3019d6256487-73e0-4496-84eb-1ec0f1c31085',
};
