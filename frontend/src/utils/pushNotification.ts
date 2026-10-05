import { api } from '../services/api.js';

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Check if the current browser supports native push notifications
 */
export const isPushNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
};

/**
 * Request notification permissions from user
 */
export const requestPushNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!isPushNotificationSupported()) {
    console.warn('Push notifications are not supported in this browser.');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Generate and register device token with backend
      const deviceToken = `web-push-${Math.random().toString(36).substring(2, 15)}-${Date.now()}`;
      try {
        await api.registerFCMToken(deviceToken, navigator.userAgent);
        localStorage.setItem('smit_fcm_token', deviceToken);
      } catch (err) {
        console.warn('Failed to sync push token with backend:', err);
      }
    }
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
};

/**
 * Send a local browser push notification
 */
export const triggerBrowserNotification = (payload: PushNotificationPayload): boolean => {
  if (!isPushNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(payload.title, {
          body: payload.body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          data: { url: payload.url || '/' },
        });
      });
      return true;
    } else {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.svg',
      });
      return true;
    }
  } catch (e) {
    console.error('Failed to trigger browser notification:', e);
    return false;
  }
};
