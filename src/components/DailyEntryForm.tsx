import React, { useState, useRef } from 'react';
import { Camera, Upload, Plus, Trash2, Calendar, MapPin, Check, Loader2, Sparkles } from 'lucide-react';
import { DailyLogEntry, PhotoItem } from '../types';
import { processAndCompressImage } from '../utils/imageUtils';

interface DailyEntryFormProps {
  initialEntry?: DailyLogEntry | null;
  existingLocations: string[];
  onSave: (entry: DailyLogEntry) => Promise<void>;
  onCancel: () => void;
}

export const DailyEntryForm: React.FC<DailyEntryFormProps> = ({
  initialEntry,
  existingLocations,
  onSave,
  onCancel,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState<string>(initialEntry?.date || todayStr);
  const [location, setLocation] = useState<string>(initialEntry?.location || '');
  const [photos, setPhotos] = useState<PhotoItem[]>(initialEntry?.photos || []);
  const [notes, setNotes] = useState<string>(initialEntry?.notes || '');
  const [isProcessingPhotos, setIsProcessingPhotos] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsProcessingPhotos(true);
    const newPhotoItems: PhotoItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      try {
        const compressed = await processAndCompressImage(file, 1400, 0.82);
        newPhotoItems.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dataUrl: compressed.dataUrl,
          fileName: file.name,
          width: compressed.width,
          height: compressed.height,
        });
      } catch (err) {
        console.error('Error processing image:', err);
      }
    }

    setPhotos((prev) => [...prev, ...newPhotoItems]);
    setIsProcessingPhotos(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    await handleFiles(e.dataTransfer.files);
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleMovePhoto = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= photos.length) return;
    const newPhotos = [...photos];
    const temp = newPhotos[index];
    newPhotos[index] = newPhotos[targetIndex];
    newPhotos[targetIndex] = temp;
    setPhotos(newPhotos);
  };

  const setDatePreset = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !location.trim()) return;

    setIsSaving(true);
    const entryToSave: DailyLogEntry = {
      id: initialEntry?.id || `log-${Date.now()}`,
      date,
      location: location.trim(),
      photos,
      notes: notes.trim(),
      createdAt: initialEntry?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };

    await onSave(entryToSave);
    setIsSaving(false);
  };

  // Filter unique existing locations for quick suggestion pills
  const uniqueLocations = Array.from(new Set(existingLocations))
    .filter((loc) => loc && loc.toLowerCase() !== location.toLowerCase())
    .slice(0, 5);

  return (
    <div
      id="daily-entry-modal"
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-neutral-200 my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 bg-neutral-50/80">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-neutral-900">
                {initialEntry ? 'Edit Daily Log' : 'Add Daily Photos & Location'}
              </h2>
              <p className="text-xs text-neutral-500">Record photos for date & location to include in monthly report</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Date Picker Row */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="input-entry-date" className="flex items-center text-xs font-semibold text-neutral-700">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Date of Activity
              </label>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setDatePreset(0)}
                  className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                    date === todayStr ? 'bg-blue-100 text-blue-800' : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset(1)}
                  className="text-[11px] px-2 py-0.5 rounded font-medium bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <input
              id="input-entry-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
              required
            />
          </div>

          {/* Location Row */}
          <div>
            <label htmlFor="input-entry-location" className="flex items-center text-xs font-semibold text-neutral-700 mb-1.5">
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Location / Area
            </label>
            <input
              id="input-entry-location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. NEC - Building Roof Floor, NEC - Building Six Floor"
              className="w-full text-sm px-3.5 py-2.5 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
              required
            />

            {/* Quick Suggestions */}
            {uniqueLocations.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-neutral-400 flex items-center">
                  <Sparkles className="w-3 h-3 mr-1" /> Quick tap:
                </span>
                {uniqueLocations.map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setLocation(loc)}
                    className="text-[11px] px-2 py-1 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-md transition-colors"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Photos Upload Zone */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center text-xs font-semibold text-neutral-700">
                <Camera className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Photos ({photos.length} added)
              </label>
              <span className="text-[11px] text-neutral-400">Word report formats in 3-column rows</span>
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center">
                <div className="flex items-center space-x-2 mb-2.5">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="inline-flex items-center px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 mr-1.5" />
                    Take Photo
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-3.5 py-2 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 text-xs font-medium shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 mr-1.5 text-neutral-500" />
                    Upload from Gallery / Files
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 hidden sm:block">
                  Or drag and drop multiple photos here
                </p>
              </div>

              {isProcessingPhotos && (
                <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-blue-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing and optimizing photos...</span>
                </div>
              )}
            </div>

            {/* Thumbnail Preview Grid (3 columns to preview real report layout!) */}
            {photos.length > 0 && (
              <div className="mt-3">
                <div className="text-[11px] font-medium text-neutral-500 mb-2 flex items-center justify-between">
                  <span>Photo Arrangement ({photos.length})</span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-800 text-[11px] font-medium flex items-center"
                  >
                    <Plus className="w-3 h-3 mr-0.5" /> Add more
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((photo, idx) => (
                    <div
                      key={photo.id}
                      className="group relative aspect-4/3 bg-neutral-100 rounded-lg overflow-hidden border border-neutral-200"
                    >
                      <img
                        src={photo.dataUrl}
                        alt={`Logged ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Photo sequence badge */}
                      <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
                        #{idx + 1}
                      </span>

                      {/* Action buttons */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(idx, 'left')}
                            title="Move left"
                            className="p-1 bg-white/90 text-neutral-800 rounded hover:bg-white text-xs"
                          >
                            ←
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          title="Remove photo"
                          className="p-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {idx < photos.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMovePhoto(idx, 'right')}
                            title="Move right"
                            className="p-1 bg-white/90 text-neutral-800 rounded hover:bg-white text-xs"
                          >
                            →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Optional Notes */}
          <div>
            <label htmlFor="input-entry-notes" className="block text-xs font-semibold text-neutral-700 mb-1">
              Inspection Notes / Description (Optional)
            </label>
            <textarea
              id="input-entry-notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Completed camera cleaning, lens polish, checked cable glands"
              className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 bg-white"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs sm:text-sm text-neutral-600 hover:text-neutral-800 hover:bg-neutral-200/50 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving || !date || !location.trim()}
            className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Save Entry
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
