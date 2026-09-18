import React, { useEffect, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
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

  if (showReconnected) {
    return (
      <div className="fixed bottom-4 left-4 z-40 flex items-center space-x-2 bg-emerald-700 text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-lg border border-emerald-600 animate-fade-in print:hidden">
        <Check className="w-3.5 h-3.5" />
        <span>Back online — All data synced</span>
      </div>
    );
  }

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex items-center space-x-2 bg-neutral-900/90 backdrop-blur-xs text-white text-xs font-medium px-3.5 py-2 rounded-xl shadow-xl border border-neutral-700 animate-fade-in print:hidden">
      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode Active • Stored locally</span>
    </div>
  );
};
