import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoItem } from '../types';

interface PhotoLightboxProps {
  photos: PhotoItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  caption?: string;
}

export const PhotoLightbox: React.FC<PhotoLightboxProps> = ({
  photos,
  currentIndex,
  onClose,
  onNavigate,
  caption,
}) => {
  const currentPhoto = photos[currentIndex];

  if (!currentPhoto) return null;

  return (
    <div
      id="photo-lightbox-modal"
      className="fixed inset-0 z-50 bg-black/90 flex flex-col justify-between p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between text-white py-2 px-3 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="text-sm font-medium opacity-90">
          Photo {currentIndex + 1} of {photos.length}
          {caption && <span className="ml-3 text-neutral-400 font-normal">| {caption}</span>}
        </div>
        <button
          id="btn-close-lightbox"
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          aria-label="Close photo preview"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="relative flex-1 flex items-center justify-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {photos.length > 1 && (
          <button
            id="btn-lightbox-prev"
            onClick={() => onNavigate((currentIndex - 1 + photos.length) % photos.length)}
            className="absolute left-2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors z-20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <img
          src={currentPhoto.dataUrl}
          alt={caption || `Photo ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded select-none shadow-2xl"
        />

        {photos.length > 1 && (
          <button
            id="btn-lightbox-next"
            onClick={() => onNavigate((currentIndex + 1) % photos.length)}
            className="absolute right-2 p-3 rounded-full bg-black/40 hover:bg-black/70 text-white transition-colors z-20"
            aria-label="Next photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      <div className="text-center text-xs text-neutral-400 py-2" onClick={(e) => e.stopPropagation()}>
        Tap outside or press ESC to close
      </div>
    </div>
  );
};
