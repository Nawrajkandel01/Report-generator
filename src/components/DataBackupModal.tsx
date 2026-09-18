import React, { useState } from 'react';
import { X, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DailyLogEntry, ReportHeaderSettings } from '../types';

interface DataBackupModalProps {
  logs: DailyLogEntry[];
  settings: ReportHeaderSettings;
  onImport: (importedLogs: DailyLogEntry[], importedSettings?: ReportHeaderSettings) => Promise<void>;
  onClose: () => void;
}

export const DataBackupModal: React.FC<DataBackupModalProps> = ({
  logs,
  settings,
  onImport,
  onClose,
}) => {
  const [importing, setImporting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleExport = () => {
    const backupObject = {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings,
      logs,
    };

    const jsonString = JSON.stringify(backupObject);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `photo-reports-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setStatusMessage({ type: 'success', text: `Successfully exported ${logs.length} daily logs!` });
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setStatusMessage(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.logs || !Array.isArray(parsed.logs)) {
        throw new Error('Invalid backup format: missing logs array');
      }

      await onImport(parsed.logs, parsed.settings);
      setStatusMessage({
        type: 'success',
        text: `Imported ${parsed.logs.length} entries successfully!`,
      });
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse backup file';
      setStatusMessage({
        type: 'error',
        text: msg,
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      id="backup-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Transfer & Backup Data</h2>
            <p className="text-xs text-neutral-500">Run locally on iPhone & Laptop with easy sync</p>
          </div>
          <button
            id="btn-close-backup"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {statusMessage && (
            <div
              className={`p-3 rounded-lg flex items-start space-x-2 text-xs font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Export section */}
          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
            <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1">Export Data</h3>
            <p className="text-xs text-neutral-600 mb-3">
              Download all your logged dates, locations, and photos into a local backup file.
            </p>
            <button
              id="btn-export-json"
              type="button"
              onClick={handleExport}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium rounded-lg shadow-xs transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Backup File ({logs.length} logs)
            </button>
          </div>

          {/* Import section */}
          <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50/50">
            <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1">
              Import to this device
            </h3>
            <p className="text-xs text-neutral-600 mb-3">
              Load previously exported data from your iPhone onto your laptop or vice versa.
            </p>
            <label
              htmlFor="input-import-file"
              className={`w-full inline-flex items-center justify-center px-4 py-2.5 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-lg cursor-pointer transition-colors ${
                importing ? 'opacity-50 pointer-events-none' : ''
              }`}
            >
              <Upload className="w-4 h-4 mr-2 text-neutral-500" />
              {importing ? 'Importing logs...' : 'Select Backup File (.json)'}
            </label>
            <input
              id="input-import-file"
              type="file"
              accept=".json,application/json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          <div className="text-[11px] text-neutral-500 leading-relaxed">
            All your daily photos and data are stored locally in your browser&apos;s IndexedDB database, allowing full offline usage on both mobile Safari and desktop browsers.
          </div>
        </div>
      </div>
    </div>
  );
};
