export interface PhotoItem {
  id: string;
  dataUrl: string; // base64 or blob URL
  fileName?: string;
  width?: number;
  height?: number;
  capturedAt?: string;
}

export interface DailyLogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  location: string;
  photos: PhotoItem[];
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ReportHeaderSettings {
  companyName: string;
  companySubtitle: string;
  logoUrl?: string; // base64 or SVG
  docNumber: string;
  revNumber: string;
  reportDate: string; // e.g. YYYY-MM-DD or formatted
  reportTitle: string; // e.g. "CCTV CAMERA CLEANING PHOTO REPORT"
  photosPerRow: 2 | 3;
  pageBreakPerLocation: boolean;
}
