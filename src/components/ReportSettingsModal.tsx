import React, { useState } from 'react';
import { X, Save, RotateCcw } from 'lucide-react';
import { ReportHeaderSettings } from '../types';
import { DEFAULT_SETTINGS } from '../utils/storage';

interface ReportSettingsModalProps {
  settings: ReportHeaderSettings;
  onSave: (newSettings: ReportHeaderSettings) => void;
  onClose: () => void;
}

export const ReportSettingsModal: React.FC<ReportSettingsModalProps> = ({
  settings,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<ReportHeaderSettings>({ ...settings });

  const handleChange = (field: keyof ReportHeaderSettings, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    setFormData({ ...DEFAULT_SETTINGS });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div
      id="report-settings-modal"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div>
            <h2 className="text-base font-semibold text-neutral-900">Word Report Header Settings</h2>
            <p className="text-xs text-neutral-500">Customizes the top table and layout in your Microsoft Word export</p>
          </div>
          <button
            id="btn-close-settings"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Company Primary Name</label>
              <input
                id="input-company-name"
                type="text"
                value={formData.companyName}
                onChange={(e) => handleChange('companyName', e.target.value)}
                placeholder="e.g. Capital"
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Company Subtitle / Tagline</label>
              <input
                id="input-company-subtitle"
                type="text"
                value={formData.companySubtitle}
                onChange={(e) => handleChange('companySubtitle', e.target.value)}
                placeholder="e.g. Security Systems"
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Report Title Banner</label>
            <input
              id="input-report-title"
              type="text"
              value={formData.reportTitle}
              onChange={(e) => handleChange('reportTitle', e.target.value)}
              placeholder="e.g. CCTV CAMERA CLEANING PHOTO REPORT"
              className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              required
            />
            <span className="text-[11px] text-neutral-500 mt-0.5 block">
              The month/year (e.g. &ldquo;– SEPTEMBER 2026&rdquo;) is automatically appended based on the selected report month.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Document Ref No.</label>
              <input
                id="input-doc-number"
                type="text"
                value={formData.docNumber}
                onChange={(e) => handleChange('docNumber', e.target.value)}
                placeholder="CSS-PM-CPR-001"
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">Revision No. (Rev No.)</label>
              <input
                id="input-rev-number"
                type="text"
                value={formData.revNumber}
                onChange={(e) => handleChange('revNumber', e.target.value)}
                placeholder="00"
                className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">Report Header Date</label>
            <input
              id="input-report-date"
              type="text"
              value={formData.reportDate}
              onChange={(e) => handleChange('reportDate', e.target.value)}
              placeholder="e.g. 31-09-2026 or leave blank for current date"
              className="w-full text-sm px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
            />
          </div>

          <div className="pt-2 border-t border-neutral-100 flex items-center justify-between">
            <div>
              <label className="block text-xs font-medium text-neutral-800">Photos Per Row in Word Table</label>
              <span className="text-[11px] text-neutral-500">Matches the 3-column layout from your reference images</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleChange('photosPerRow', 2)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  formData.photosPerRow === 2
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                2 per row
              </button>
              <button
                type="button"
                onClick={() => handleChange('photosPerRow', 3)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  formData.photosPerRow === 3
                    ? 'bg-blue-50 border-blue-600 text-blue-700'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                3 per row (Default)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <label htmlFor="checkbox-page-break" className="text-xs font-medium text-neutral-800 block cursor-pointer">
                Page Break for each Day / Location
              </label>
              <span className="text-[11px] text-neutral-500">Starts each day on a fresh new page in Word</span>
            </div>
            <input
              id="checkbox-page-break"
              type="checkbox"
              checked={formData.pageBreakPerLocation}
              onChange={(e) => handleChange('pageBreakPerLocation', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-neutral-300 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <button
              type="button"
              id="btn-reset-settings"
              onClick={handleReset}
              className="inline-flex items-center text-xs text-neutral-600 hover:text-neutral-900 py-2 px-3 rounded hover:bg-neutral-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              Reset Defaults
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="btn-save-settings"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Apply Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
