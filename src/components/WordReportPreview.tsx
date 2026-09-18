import React, { useState } from 'react';
import { Download, Printer, Settings2, FileText, Check, Loader2 } from 'lucide-react';
import { DailyLogEntry, ReportHeaderSettings } from '../types';
import { formatReportDate, formatMonthYear } from '../utils/imageUtils';
import { generateWordDocument } from '../utils/docxExport';

interface WordReportPreviewProps {
  entries: DailyLogEntry[];
  settings: ReportHeaderSettings;
  selectedMonth: string;
  onOpenSettings: () => void;
}

export const WordReportPreview: React.FC<WordReportPreviewProps> = ({
  entries,
  settings,
  selectedMonth,
  onOpenSettings,
}) => {
  const [isExportingDocx, setIsExportingDocx] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'fit' | '100%'>('100%');

  // Filter and sort entries chronologically ascending for the official report
  const filteredEntries = (
    selectedMonth === 'all'
      ? [...entries]
      : entries.filter((e) => e.date.startsWith(selectedMonth))
  ).sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  const monthLabel =
    selectedMonth === 'all'
      ? 'ALL MONTHS'
      : formatMonthYear(selectedMonth).toUpperCase();

  const fullReportTitle = `${settings.reportTitle} – ${monthLabel}`;

  const handleDownloadDocx = async () => {
    try {
      setIsExportingDocx(true);
      setDownloadSuccess(false);

      const docxBlob = await generateWordDocument(entries, settings, selectedMonth);
      const fileName = `Photo-Report-${selectedMonth === 'all' ? 'All' : selectedMonth}.docx`;

      const url = URL.createObjectURL(docxBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to generate docx:', err);
      alert('Error generating Word document. Please try again.');
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="word-report-section" className="space-y-4">
      {/* Top Action Ribbon */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-neutral-900">Microsoft Word Report View</h2>
            <p className="text-xs text-neutral-500">
              {filteredEntries.length} daily logs ({filteredEntries.reduce((acc, e) => acc + e.photos.length, 0)} photos) for {monthLabel}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
            title="Configure company name, doc number, rev number"
          >
            <Settings2 className="w-3.5 h-3.5 mr-1.5 text-neutral-600" />
            Header Settings
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 rounded-xl transition-colors"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5 text-neutral-600" />
            Print / PDF
          </button>

          <button
            type="button"
            id="btn-download-word-docx"
            onClick={handleDownloadDocx}
            disabled={isExportingDocx || filteredEntries.length === 0}
            className="inline-flex items-center px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
          >
            {isExportingDocx ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Building .docx...
              </>
            ) : downloadSuccess ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Downloaded!
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                Download Word (.docx)
              </>
            )}
          </button>
        </div>
      </div>

      {/* Screen notice if empty */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-neutral-500">
          <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-neutral-800 mb-1">No entries found for {monthLabel}</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto mb-4">
            Switch back to &ldquo;Daily Logs&rdquo; to add your date, location, and photos for this month.
          </p>
        </div>
      ) : (
        /* The Word Document Canvas (Paper Sheet) */
        <div className="overflow-x-auto pb-8 flex justify-center">
          <div
            id="printable-word-document"
            className={`bg-white text-neutral-900 border border-neutral-300 shadow-xl rounded-sm p-6 sm:p-10 font-sans transition-all ${
              zoomLevel === 'fit' ? 'w-full max-w-4xl' : 'w-full max-w-[840px]'
            } print:p-0 print:border-0 print:shadow-none print:w-full print:max-w-none`}
            style={{ minHeight: '1100px' }}
          >
            {/* 1. Exact Word Header Table (Matching IMG_4425.PNG) */}
            <div className="border-2 border-black mb-6 select-none">
              {/* Top Row Grid */}
              <div className="grid grid-cols-12 border-b border-black">
                {/* Brand / Logo column (left 7 cols) */}
                <div className="col-span-7 p-4 border-r border-black flex flex-col justify-center bg-white">
                  <div className="flex items-baseline space-x-1.5">
                    <span
                      className="text-2xl sm:text-3xl font-black tracking-tight text-blue-900"
                      style={{ fontFamily: 'Georgia, serif' }}
                    >
                      {settings.companyName}
                    </span>
                    <span
                      className="text-sm sm:text-base font-bold italic tracking-wide text-blue-800"
                      style={{ fontFamily: 'Arial, sans-serif' }}
                    >
                      {settings.companySubtitle}
                    </span>
                  </div>
                </div>

                {/* Metadata Column (right 5 cols, 4 rows) */}
                <div className="col-span-5 text-xs text-black font-sans divide-y divide-black">
                  <div className="grid grid-cols-2 p-1.5 px-2">
                    <span className="font-semibold">Document:</span>
                    <span className="font-mono text-neutral-800">{settings.docNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 px-2">
                    <span className="font-semibold">Date:</span>
                    <span>{settings.reportDate || formatReportDate(new Date().toISOString().split('T')[0])}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 px-2">
                    <span className="font-semibold">Rev No.:</span>
                    <span>{settings.revNumber}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 px-2">
                    <span className="font-semibold">Page:</span>
                    <span>Page 1 of {Math.max(1, filteredEntries.length)}</span>
                  </div>
                </div>
              </div>

              {/* Title Banner (full width row at bottom of table) */}
              <div className="bg-neutral-50 px-3 py-2 text-center text-xs sm:text-sm font-bold uppercase tracking-wider text-black">
                {fullReportTitle}
              </div>
            </div>

            {/* 2. Body: Day by Day Sections (Exact match to IMG_4425, IMG_4426, IMG_4427, IMG_4428) */}
            <div className="space-y-8">
              {filteredEntries.map((entry, index) => {
                const sectionTitle = `${entry.location}  ${formatReportDate(entry.date)}`;
                return (
                  <div
                    key={entry.id}
                    className={`space-y-3 ${
                      settings.pageBreakPerLocation && index > 0
                        ? 'print:break-before-page pt-4'
                        : ''
                    }`}
                  >
                    {/* Gray highlight title bar exactly matching the screenshots */}
                    <div className="bg-[#D2D6DC] px-3 py-1 text-black font-bold text-xs sm:text-sm tracking-tight">
                      {sectionTitle}
                    </div>

                    {/* Photo Grid: 3 columns per row (matches user screenshots 3x2 grid) */}
                    {entry.photos.length > 0 ? (
                      <div
                        className={`grid ${
                          settings.photosPerRow === 2 ? 'grid-cols-2' : 'grid-cols-3'
                        } gap-1.5 sm:gap-2`}
                      >
                        {entry.photos.map((photo, photoIndex) => (
                          <div
                            key={photo.id}
                            className="aspect-4/3 sm:aspect-4/3 bg-neutral-100 overflow-hidden flex items-center justify-center border border-neutral-200"
                          >
                            <img
                              src={photo.dataUrl}
                              alt={`${entry.location} ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-neutral-400 italic py-4 text-center border border-dashed border-neutral-200">
                        No photos captured for this date
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Document Footer */}
            <div className="mt-12 pt-4 border-t border-neutral-300 flex items-center justify-between text-[11px] text-neutral-500">
              <span>
                {settings.companyName} {settings.companySubtitle} • {settings.docNumber}
              </span>
              <span>Generated Monthly Report</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
