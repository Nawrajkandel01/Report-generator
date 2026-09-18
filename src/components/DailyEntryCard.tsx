import React from 'react';
import { Calendar, MapPin, Edit3, Trash2, Image as ImageIcon } from 'lucide-react';
import { DailyLogEntry, PhotoItem } from '../types';
import { formatReportDate } from '../utils/imageUtils';

interface DailyEntryCardProps {
  entry: DailyLogEntry;
  onEdit: (entry: DailyLogEntry) => void;
  onDelete: (id: string) => void;
  onOpenPhoto: (photos: PhotoItem[], index: number, caption: string) => void;
}

export const DailyEntryCard: React.FC<DailyEntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onOpenPhoto,
}) => {
  const formattedDate = formatReportDate(entry.date);
  const caption = `${entry.location} - ${formattedDate}`;

  return (
    <div
      id={`entry-card-${entry.id}`}
      className="bg-white border border-neutral-200/90 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-shadow"
    >
      {/* Header bar styled like the document's gray section bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-100">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
          {/* Gray highlight badge matching reference report screenshots */}
          <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-200/90 text-neutral-900 font-semibold text-xs sm:text-sm tracking-tight border border-neutral-300/60">
            <MapPin className="w-3.5 h-3.5 mr-1.5 text-neutral-700 shrink-0" />
            <span>{entry.location}</span>
          </div>

          <div className="inline-flex items-center text-xs font-medium text-neutral-600 bg-neutral-50 px-2.5 py-1 rounded-md border border-neutral-200">
            <Calendar className="w-3 h-3 mr-1 text-neutral-500" />
            {formattedDate}
          </div>

          <span className="text-[11px] font-medium text-neutral-500 flex items-center bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
            <ImageIcon className="w-3 h-3 mr-1" />
            {entry.photos.length} photos
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-1 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onEdit(entry)}
            className="p-1.5 text-neutral-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs inline-flex items-center"
            title="Edit date, location, or photos"
          >
            <Edit3 className="w-4 h-4 mr-1" />
            <span className="text-xs">Edit</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm(`Delete entries and photos for ${entry.location} (${formattedDate})?`)) {
                onDelete(entry.id);
              }
            }}
            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs inline-flex items-center"
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notes if present */}
      {entry.notes && (
        <p className="text-xs text-neutral-600 mt-2.5 mb-1 italic bg-neutral-50/70 p-2 rounded-lg border border-neutral-100">
          &ldquo;{entry.notes}&rdquo;
        </p>
      )}

      {/* 3-Column Photo Grid (Matching the exact layout in Word report) */}
      {entry.photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5 mt-3">
          {entry.photos.map((photo, idx) => (
            <div
              key={photo.id}
              onClick={() => onOpenPhoto(entry.photos, idx, caption)}
              className="group relative aspect-4/3 sm:aspect-4/3 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200/80 cursor-pointer shadow-2xs hover:border-blue-500 transition-colors"
            >
              <img
                src={photo.dataUrl}
                alt={`${entry.location} ${idx + 1}`}
                className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-200"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-[11px] font-medium bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                  View Full
                </span>
              </div>
              <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] font-mono px-1 py-0.5 rounded">
                #{idx + 1}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 text-center py-6 bg-neutral-50 rounded-xl border border-dashed border-neutral-200 text-neutral-400 text-xs">
          No photos attached yet. Tap &ldquo;Edit&rdquo; to add photos.
        </div>
      )}
    </div>
  );
};
