/**
 * Google Drive Video URL utilities
 * Helps embed and open lesson videos directly in Google Drive to prevent consuming Supabase storage.
 */

export const extractGoogleDriveFileId = (url?: string): string | null => {
  if (!url) return null;

  // Patterns:
  // 1. /file/d/FILE_ID/
  // 2. id=FILE_ID
  // 3. /open?id=FILE_ID
  const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    return matchFileD[1];
  }

  const matchIdParam = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchIdParam && matchIdParam[1]) {
    return matchIdParam[1];
  }

  return null;
};

export const isGoogleDriveUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('drive.google.com') ||
    url.includes('docs.google.com') ||
    Boolean(extractGoogleDriveFileId(url))
  );
};

export const getGoogleDrivePreviewUrl = (url?: string): string | null => {
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${fileId}/preview`;
};

export const getGoogleDriveViewUrl = (url?: string): string => {
  if (!url) return '';
  const fileId = extractGoogleDriveFileId(url);
  if (fileId) {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`;
  }
  return url;
};

export const openVideoInGoogleDrive = (url?: string): void => {
  if (!url) return;
  const targetUrl = getGoogleDriveViewUrl(url);
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
};
