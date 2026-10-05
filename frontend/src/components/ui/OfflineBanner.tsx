import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-sm p-3.5 rounded-2xl shadow-xl border flex items-center gap-3 transition-all duration-300 ${
        isOnline
          ? 'bg-emerald-500 text-white border-emerald-400'
          : 'bg-navy-950 text-white border-slate-700'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 shrink-0 animate-bounce" />
          <div className="text-xs">
            <p className="font-bold">Back Online</p>
            <p className="text-emerald-100">Live data sync has been restored.</p>
          </div>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-amber-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">Offline Mode Active</p>
            <p className="text-slate-300">Working with cached curriculum data.</p>
          </div>
        </>
      )}
    </div>
  );
};
