import React from 'react';
import {
  Share,
  PlusSquare,
  X,
  Smartphone,
  CheckCircle2,
  Download,
  WifiOff,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-neutral-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              PR
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                Install Report Generator
              </h3>
              <p className="text-[11px] text-neutral-500">
                PWA Offline App for iPhone & Laptop
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Key Advantages */}
          <div className="grid grid-cols-2 gap-2.5 text-xs text-neutral-600">
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2">
              <WifiOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-900 block">100% Offline</span>
                <span>Works on job sites without signal</span>
              </div>
            </div>
            <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-100 flex items-start space-x-2">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-neutral-900 block">Standalone</span>
                <span>Full-screen experience without Safari bars</span>
              </div>
            </div>
          </div>

          {isInstalled ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
              <p className="text-xs font-semibold text-emerald-900">
                App is already installed!
              </p>
              <p className="text-[11px] text-emerald-700">
                You are currently running Report Generator from your home screen.
              </p>
            </div>
          ) : (
            <>
              {/* iOS Instructions */}
              <div className="p-4 bg-blue-50/70 border border-blue-100 rounded-xl space-y-3">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-blue-900">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>How to install on iPhone (Safari):</span>
                </div>
                <ol className="text-xs text-blue-950/80 space-y-2 pl-1 list-none">
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200/80 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Tap the <strong>Share button</strong>{' '}
                      <Share className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" /> at the
                      bottom of your Safari screen.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200/80 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Scroll down and select{' '}
                      <strong className="text-blue-900">
                        Add to Home Screen
                      </strong>{' '}
                      <PlusSquare className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" />.
                    </span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-5 h-5 rounded-full bg-blue-200/80 text-blue-800 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Tap <strong className="text-blue-900">Add</strong> in the top-right
                      corner. The icon will appear directly on your iPhone home screen!
                    </span>
                  </li>
                </ol>
              </div>

              {/* Direct Desktop / Android Install Button if browser supports beforeinstallprompt */}
              {isInstallable && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App to Device</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-neutral-50 border-t border-neutral-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-neutral-200 hover:bg-neutral-100 text-neutral-700 rounded-xl text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
