import { DailyLogEntry, ReportHeaderSettings } from '../types';

const DB_NAME = 'daily_photo_report_db';
const DB_VERSION = 1;
const STORE_LOGS = 'daily_logs';
const STORE_SETTINGS = 'report_settings';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_LOGS)) {
        db.createObjectStore(STORE_LOGS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const DEFAULT_SETTINGS: ReportHeaderSettings = {
  companyName: 'Capital',
  companySubtitle: 'Security Systems',
  docNumber: 'CSS-PM-CPR-001',
  revNumber: '00',
  reportDate: '2026-09-30',
  reportTitle: 'CCTV CAMERA CLEANING PHOTO REPORT',
  photosPerRow: 3,
  pageBreakPerLocation: false,
};

export async function getAllLogs(): Promise<DailyLogEntry[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_LOGS, 'readonly');
      const store = tx.objectStore(STORE_LOGS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results: DailyLogEntry[] = req.result || [];
        // Sort descending by date
        results.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0));
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to get logs from IndexedDB:', err);
    return [];
  }
}

export async function saveLog(entry: DailyLogEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    const store = tx.objectStore(STORE_LOGS);
    const req = store.put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLog(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LOGS, 'readwrite');
    const store = tx.objectStore(STORE_LOGS);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getSettings(): Promise<ReportHeaderSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SETTINGS, 'readonly');
      const store = tx.objectStore(STORE_SETTINGS);
      const req = store.get('header_settings');
      req.onsuccess = () => {
        if (req.result && req.result.data) {
          resolve({ ...DEFAULT_SETTINGS, ...req.result.data });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      req.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: ReportHeaderSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_SETTINGS, 'readwrite');
    const store = tx.objectStore(STORE_SETTINGS);
    const req = store.put({ key: 'header_settings', data: settings });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Generate an inline placeholder photo for initial demonstration
function createPlaceholderImage(text: string, color: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 450;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 600, 450);

  // Grid pattern
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 2;
  for (let x = 0; x < 600; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 450);
    ctx.stroke();
  }
  for (let y = 0; y < 450; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(600, y);
    ctx.stroke();
  }

  // Camera icon outline
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(300, 200, 50, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(300, 200, 36, 0, Math.PI * 2);
  ctx.fill();

  // Text label
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 300, 310);

  // Timestamp simulation
  ctx.font = '14px monospace';
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillText('Inspection Photo • Certified', 300, 345);

  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Seeds initial demo entries matching the user's example screenshots
 * so the user can immediately view their exact report style.
 */
export async function seedInitialDemoIfEmpty(): Promise<DailyLogEntry[]> {
  const existing = await getAllLogs();
  if (existing.length > 0) return existing;

  const sampleEntries: DailyLogEntry[] = [
    {
      id: 'demo-1',
      date: '2026-09-01',
      location: 'NEC - Building Roof Floor',
      notes: 'Cleaned camera housings, dome covers and brackets',
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
      photos: [
        { id: 'p1', dataUrl: createPlaceholderImage('Cam #01 - Roof Outer Wall', '#3b5998') },
        { id: 'p2', dataUrl: createPlaceholderImage('Cam #02 - Bracket Mount', '#4a69bd') },
        { id: 'p3', dataUrl: createPlaceholderImage('Cam #03 - Dome Polish', '#1e3799') },
        { id: 'p4', dataUrl: createPlaceholderImage('Cam #04 - Ladder Access', '#0c2461') },
        { id: 'p5', dataUrl: createPlaceholderImage('Cam #05 - Housing Clean', '#2980b9') },
        { id: 'p6', dataUrl: createPlaceholderImage('Cam #06 - Final Check', '#34495e') },
      ],
    },
    {
      id: 'demo-2',
      date: '2026-09-02',
      location: 'NEC - Building Six Floor',
      notes: 'Interior hallway dome cameras cleaning',
      createdAt: Date.now() - 4 * 86400000,
      updatedAt: Date.now() - 4 * 86400000,
      photos: [
        { id: 'p7', dataUrl: createPlaceholderImage('Cam #07 - Ceiling Dome', '#2c3e50') },
        { id: 'p8', dataUrl: createPlaceholderImage('Cam #08 - Corridor North', '#576574') },
        { id: 'p9', dataUrl: createPlaceholderImage('Cam #09 - Corridor South', '#4b6584') },
        { id: 'p10', dataUrl: createPlaceholderImage('Cam #10 - Lens Spray', '#222f3e') },
        { id: 'p11', dataUrl: createPlaceholderImage('Cam #11 - Wipe Down', '#2d3436') },
        { id: 'p12', dataUrl: createPlaceholderImage('Cam #12 - Inspection Passed', '#636e72') },
      ],
    },
    {
      id: 'demo-3',
      date: '2026-09-03',
      location: 'NEC Building Five Floor',
      notes: 'Cleaned courtyard wall cameras',
      createdAt: Date.now() - 3 * 86400000,
      updatedAt: Date.now() - 3 * 86400000,
      photos: [
        { id: 'p13', dataUrl: createPlaceholderImage('Cam #13 - Archway Cam', '#16a085') },
        { id: 'p14', dataUrl: createPlaceholderImage('Cam #14 - Pillar Mount', '#1abc9c') },
        { id: 'p15', dataUrl: createPlaceholderImage('Cam #15 - High Ladder Wipe', '#27ae60') },
        { id: 'p16', dataUrl: createPlaceholderImage('Cam #16 - Microfiber Polish', '#2ecc71') },
        { id: 'p17', dataUrl: createPlaceholderImage('Cam #17 - Cable Gland Check', '#009432') },
        { id: 'p18', dataUrl: createPlaceholderImage('Cam #18 - Finished State', '#006266') },
      ],
    },
  ];

  for (const entry of sampleEntries) {
    await saveLog(entry);
  }

  return sampleEntries;
}
