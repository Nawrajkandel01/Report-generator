/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Image as ImageIcon,
  MapPin,
  FileDown,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { DailyLogEntry, PhotoItem, ReportHeaderSettings } from './types';
import {
  getAllLogs,
  saveLog,
  deleteLog,
  getSettings,
  saveSettings,
  seedInitialDemoIfEmpty,
  DEFAULT_SETTINGS,
} from './utils/storage';
import { HeaderBar } from './components/HeaderBar';
import { DailyEntryCard } from './components/DailyEntryCard';
import { DailyEntryForm } from './components/DailyEntryForm';
import { WordReportPreview } from './components/WordReportPreview';
import { ReportSettingsModal } from './components/ReportSettingsModal';
import { DataBackupModal } from './components/DataBackupModal';
import { PhotoLightbox } from './components/PhotoLightbox';
import { PWAInstallModal } from './components/PWAInstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { usePWAInstall } from './hooks/usePWAInstall';
import { formatMonthYear } from './utils/imageUtils';

export default function App() {
  const [logs, setLogs] = useState<DailyLogEntry[]>([]);
  const [settings, setSettings] = useState<ReportHeaderSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'entries' | 'report'>('entries');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [searchQuery, setSearchQuery] = useState('');

  // PWA install state
  const { isInstalled } = usePWAInstall();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // Modal states
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DailyLogEntry | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Lightbox state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    photos: PhotoItem[];
    currentIndex: number;
    caption?: string;
  }>({
    isOpen: false,
    photos: [],
    currentIndex: 0,
    caption: '',
  });

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Initial load
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [savedSettings, initialLogs] = await Promise.all([
          getSettings(),
          seedInitialDemoIfEmpty(),
        ]);
        setSettings(savedSettings);
        setLogs(initialLogs);

        // If entries exist, select the month of the most recent entry
        if (initialLogs.length > 0) {
          const latestDate = initialLogs[0].date;
          const ym = latestDate.substring(0, 7);
          setSelectedMonth(ym);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute available unique months from entries
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    // Always include selectedMonth if set
    if (selectedMonth && selectedMonth !== 'all') set.add(selectedMonth);

    logs.forEach((log) => {
      if (log.date && log.date.length >= 7) {
        set.add(log.date.substring(0, 7));
      }
    });

    const arr = Array.from(set).sort((a, b) => (b > a ? 1 : b < a ? -1 : 0));
    return ['all', ...arr];
  }, [logs, selectedMonth]);

  // Extract unique locations for suggestions
  const existingLocations = useMemo(() => {
    return Array.from(new Set(logs.map((l) => l.location).filter(Boolean)));
  }, [logs]);

  // Filter logs by selected month and search query
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesMonth =
        selectedMonth === 'all' || log.date.startsWith(selectedMonth);
      const matchesSearch =
        !searchQuery ||
        log.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.date.includes(searchQuery) ||
        (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesMonth && matchesSearch;
    });
  }, [logs, selectedMonth, searchQuery]);

  // Statistics for selected month
  const monthStats = useMemo(() => {
    const monthLogs =
      selectedMonth === 'all'
        ? logs
        : logs.filter((l) => l.date.startsWith(selectedMonth));
    const totalPhotos = monthLogs.reduce((sum, l) => sum + l.photos.length, 0);
    return {
      daysCount: monthLogs.length,
      totalPhotos,
    };
  }, [logs, selectedMonth]);

  // Handlers
  const handleSaveEntry = async (entry: DailyLogEntry) => {
    await saveLog(entry);
    setLogs((prev) => {
      const existsIndex = prev.findIndex((e) => e.id === entry.id);
      if (existsIndex >= 0) {
        const updated = [...prev];
        updated[existsIndex] = entry;
        return updated.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
      } else {
        return [entry, ...prev].sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
      }
    });

    // Update selected month if new entry is outside current selection
    const entryMonth = entry.date.substring(0, 7);
    if (selectedMonth !== 'all' && selectedMonth !== entryMonth) {
      setSelectedMonth(entryMonth);
    }

    setIsEntryFormOpen(false);
    setEditingEntry(null);
    showToast(`Saved entry for ${entry.location} (${entry.photos.length} photos)`);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteLog(id);
    setLogs((prev) => prev.filter((e) => e.id !== id));
    showToast('Entry deleted');
  };

  const handleSaveSettings = async (newSettings: ReportHeaderSettings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
    showToast('Report header settings updated');
  };

  const handleImportBackup = async (
    importedLogs: DailyLogEntry[],
    importedSettings?: ReportHeaderSettings
  ) => {
    for (const log of importedLogs) {
      await saveLog(log);
    }
    if (importedSettings) {
      await saveSettings(importedSettings);
      setSettings(importedSettings);
    }
    const all = await getAllLogs();
    setLogs(all);
    showToast(`Successfully imported ${importedLogs.length} logs!`);
  };

  const openLightbox = (photos: PhotoItem[], index: number, caption: string) => {
    setLightboxState({
      isOpen: true,
      photos,
      currentIndex: index,
      caption,
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans antialiased flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* App Header */}
      <HeaderBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        availableMonths={availableMonths}
        totalLogsCount={logs.length}
        onOpenNewEntry={() => {
          setEditingEntry(null);
          setIsEntryFormOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBackup={() => setIsBackupOpen(true)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
        isInstalled={isInstalled}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed top-16 right-4 z-50 bg-neutral-900 text-white text-xs font-medium px-4 py-2.5 rounded-xl shadow-xl flex items-center space-x-2 animate-fade-in border border-neutral-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab 1: Daily Entries Interface */}
        {activeTab === 'entries' && (
          <div className="space-y-4">
            {/* Top Overview & Action Bar */}
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base sm:text-lg font-bold text-neutral-900">
                    {selectedMonth === 'all'
                      ? 'All Logged Days'
                      : `${formatMonthYear(selectedMonth)} Daily Logs`}
                  </h2>
                  <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                    {monthStats.daysCount} days • {monthStats.totalPhotos} photos
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Log your inspection photos day by day with date and location. At month end, switch to the Word Report tab to generate your report.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  id="btn-switch-to-report-cta"
                  onClick={() => setActiveTab('report')}
                  className="inline-flex items-center px-3.5 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors"
                >
                  <FileDown className="w-4 h-4 mr-1.5 text-blue-600" />
                  View Word Report
                </button>
                <button
                  type="button"
                  id="btn-add-entry-main"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsEntryFormOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Log Day Photos
                </button>
              </div>
            </div>

            {/* Search and Quick Filters */}
            <div className="flex items-center space-x-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by location (e.g. Building Roof Floor, Six Floor) or date..."
                  className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 shadow-2xs"
                />
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-neutral-500 hover:text-neutral-800 bg-white border border-neutral-200 px-3 py-2.5 rounded-xl"
                >
                  Clear
                </button>
              )}
            </div>

            {/* List of Daily Entries */}
            {loading ? (
              <div className="py-16 text-center text-xs text-neutral-400">Loading daily logs...</div>
            ) : filteredLogs.length === 0 ? (
              <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-800 mb-1">
                  No logs found for this period
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  Tap &ldquo;Log Day Photos&rdquo; to record your date, location, and camera photos.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsEntryFormOpen(true);
                  }}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Entry
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredLogs.map((entry) => (
                  <DailyEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={(e) => {
                      setEditingEntry(e);
                      setIsEntryFormOpen(true);
                    }}
                    onDelete={handleDeleteEntry}
                    onOpenPhoto={openLightbox}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Word Report View (As in Microsoft Word) */}
        {activeTab === 'report' && (
          <WordReportPreview
            entries={logs}
            settings={settings}
            selectedMonth={selectedMonth}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </main>

      {/* Floating Action Button for Mobile Users (positioned above iOS safe-area home bar) */}
      {activeTab === 'entries' && (
        <div className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] right-5 sm:hidden z-30">
          <button
            type="button"
            id="btn-fab-add-mobile"
            onClick={() => {
              setEditingEntry(null);
              setIsEntryFormOpen(true);
            }}
            className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            aria-label="Add new entry"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Entry Form Modal */}
      {isEntryFormOpen && (
        <DailyEntryForm
          initialEntry={editingEntry}
          existingLocations={existingLocations}
          onSave={handleSaveEntry}
          onCancel={() => {
            setIsEntryFormOpen(false);
            setEditingEntry(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <ReportSettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* Backup & Transfer Modal */}
      {isBackupOpen && (
        <DataBackupModal
          logs={logs}
          settings={settings}
          onImport={handleImportBackup}
          onClose={() => setIsBackupOpen(false)}
        />
      )}

      {/* Photo Lightbox */}
      {lightboxState.isOpen && (
        <PhotoLightbox
          photos={lightboxState.photos}
          currentIndex={lightboxState.currentIndex}
          caption={lightboxState.caption}
          onClose={() => setLightboxState((prev) => ({ ...prev, isOpen: false }))}
          onNavigate={(newIdx) =>
            setLightboxState((prev) => ({ ...prev, currentIndex: newIdx }))
          }
        />
      )}

      {/* PWA iPhone & Desktop Install Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Offline Status Badge */}
      <OfflineIndicator />
    </div>
  );
}
