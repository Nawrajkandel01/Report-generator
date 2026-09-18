import React from 'react';
import {
  CalendarDays,
  FileText,
  Plus,
  Settings2,
  HardDriveDownload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatMonthYear } from '../utils/imageUtils';

interface HeaderBarProps {
  activeTab: 'entries' | 'report';
  setActiveTab: (tab: 'entries' | 'report') => void;
  selectedMonth: string; // 'YYYY-MM' or 'all'
  setSelectedMonth: (m: string) => void;
  availableMonths: string[];
  totalLogsCount: number;
  onOpenNewEntry: () => void;
  onOpenSettings: () => void;
  onOpenBackup: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  availableMonths,
  totalLogsCount,
  onOpenNewEntry,
  onOpenSettings,
  onOpenBackup,
}) => {
  const handlePrevMonth = () => {
    if (selectedMonth === 'all') return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month - 2, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') return;
    const [year, month] = selectedMonth.split('-').map(Number);
    const d = new Date(year, month, 1);
    const newMonthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(newMonthStr);
  };

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30 shadow-2xs print:hidden">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Mode Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                PR
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-bold text-neutral-900 tracking-tight leading-none">
                  Photo Report Generator
                </h1>
                <span className="text-[11px] text-neutral-500">
                  Laptop & iPhone • Local & Offline
                </span>
              </div>
            </div>

            {/* Quick Actions on Mobile */}
            <div className="flex items-center space-x-1 md:hidden">
              <button
                type="button"
                onClick={onOpenBackup}
                title="Backup / Transfer"
                className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              >
                <HardDriveDownload className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenSettings}
                title="Settings"
                className="p-2 text-neutral-500 hover:text-neutral-900 rounded-lg hover:bg-neutral-100"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Tabs & Month Picker */}
          <div className="flex items-center justify-between md:justify-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="inline-flex p-1 bg-neutral-100 rounded-xl border border-neutral-200/80">
              <button
                type="button"
                id="tab-daily-entries"
                onClick={() => setActiveTab('entries')}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'entries'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Daily Logs
                <span className="ml-1.5 bg-neutral-100 px-1.5 py-0.2 rounded-full text-[10px] text-neutral-600 border border-neutral-200">
                  {totalLogsCount}
                </span>
              </button>

              <button
                type="button"
                id="tab-monthly-report"
                onClick={() => setActiveTab('report')}
                className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'report'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                Word Report
              </button>
            </div>

            {/* Month Navigator */}
            <div className="inline-flex items-center bg-neutral-50 border border-neutral-200 rounded-xl px-2 py-1 space-x-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                disabled={selectedMonth === 'all'}
                className="p-1 hover:bg-neutral-200 rounded text-neutral-600 disabled:opacity-30 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <select
                id="select-month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-medium text-neutral-800 bg-transparent border-0 focus:outline-none cursor-pointer py-0.5"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m === 'all' ? 'All Months' : formatMonthYear(m)}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleNextMonth}
                disabled={selectedMonth === 'all'}
                className="p-1 hover:bg-neutral-200 rounded text-neutral-600 disabled:opacity-30 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right: New Entry Button & Desktop Settings */}
          <div className="hidden md:flex items-center space-x-2">
            <button
              type="button"
              onClick={onOpenBackup}
              title="Backup / Transfer between iPhone & Laptop"
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <HardDriveDownload className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              title="Report Header Settings"
              className="p-2 text-neutral-500 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <Settings2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="btn-add-entry-top"
              onClick={onOpenNewEntry}
              className="inline-flex items-center px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Daily Log
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
