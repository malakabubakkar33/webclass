/**
 * Universal High-Speed Video Streaming & Storage Utilities
 * Supports Bunny.net Stream, YouTube Unlisted, Google Drive, and Direct Video CDN.
 * Ensures 0 bytes of Supabase database storage is consumed for 1-hour+ lectures!
 */

// ==========================================
// 1. BUNNY.NET STREAM
// ==========================================

export const isBunnyUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('mediadelivery.net') ||
    url.includes('bunnycdn.com') ||
    url.includes('b-cdn.net')
  );
};

export const getBunnyEmbedUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // If already embed URL: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
  if (trimmed.includes('iframe.mediadelivery.net/embed/')) {
    return trimmed;
  }

  // If play URL: https://iframe.mediadelivery.net/play/{libraryId}/{videoId}
  if (trimmed.includes('iframe.mediadelivery.net/play/')) {
    return trimmed.replace('/play/', '/embed/');
  }

  // If direct stream URL or iframe tag
  const iframeSrcMatch = trimmed.match(/src=["'](.*?)["']/);
  if (iframeSrcMatch && iframeSrcMatch[1]) {
    return iframeSrcMatch[1];
  }

  return trimmed;
};

// ==========================================
// 2. YOUTUBE (UNLISTED / CLASS LECTURES)
// ==========================================

export const extractYouTubeId = (url?: string): string | null => {
  if (!url) return null;
  const clean = url.trim();

  // Standard: youtube.com/watch?v=VIDEO_ID
  const watchMatch = clean.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) return watchMatch[1];

  // Short: youtu.be/VIDEO_ID
  const shortMatch = clean.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) return shortMatch[1];

  // Embed: youtube.com/embed/VIDEO_ID
  const embedMatch = clean.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  // Live: youtube.com/live/VIDEO_ID
  const liveMatch = clean.match(/youtube\.com\/live\/([a-zA-Z0-9_-]{11})/);
  if (liveMatch && liveMatch[1]) return liveMatch[1];

  return null;
};

export const isYouTubeUrl = (url?: string): boolean => {
  if (!url) return false;
  return (
    url.includes('youtube.com') ||
    url.includes('youtu.be') ||
    Boolean(extractYouTubeId(url))
  );
};

export const getYouTubeEmbedUrl = (url?: string): string | null => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&enablejsapi=1`;
};

export const getYouTubeThumbnail = (url?: string): string | null => {
  const videoId = extractYouTubeId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

// ==========================================
// 3. GOOGLE DRIVE
// ==========================================

export const extractGoogleDriveFileId = (url?: string): string | null => {
  if (!url) return null;

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

// ==========================================
// 4. PLATFORM RESOLVER
// ==========================================

export type VideoPlatformType = 'bunny' | 'youtube' | 'drive' | 'direct';

export const getVideoPlatformType = (url?: string): VideoPlatformType => {
  if (!url) return 'direct';
  if (isBunnyUrl(url)) return 'bunny';
  if (isYouTubeUrl(url)) return 'youtube';
  if (isGoogleDriveUrl(url)) return 'drive';
  return 'direct';
};

// ==========================================
// 5. YOUTUBE ICON SVG COMPONENT
// ==========================================
import React from 'react';

export const Youtube: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  return React.createElement(
    'svg',
    {
      viewBox: '0 0 24 24',
      fill: 'currentColor',
      className,
    },
    React.createElement('path', {
      d: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    })
  );
};

