/**
 * Compresses an image file to a manageable size (e.g. max 1400px)
 * to keep IndexedDB and generated Word docx files fast and optimized.
 */
export async function processAndCompressImage(file: File, maxDimension = 1400, quality = 0.82): Promise<{ dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: event.target?.result as string, width: img.width, height: img.height });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({
          dataUrl: compressedDataUrl,
          width,
          height,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a base64 DataURL to a Uint8Array for docx ImageRun
 */
export function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const parts = dataUrl.split(',');
  const base64 = parts[1] || parts[0];
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Formats a date string 'YYYY-MM-DD' into human readable format like:
 * 'September 01, 2026'
 */
export function formatReportDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const d = new Date(year, month - 1, day);
    const monthName = d.toLocaleString('en-US', { month: 'long' });
    const dayStr = String(day).padStart(2, '0');
    return `${monthName} ${dayStr}, ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Format Year-Month (e.g. "2026-09" -> "September 2026")
 */
export function formatMonthYear(yearMonthStr: string): string {
  if (!yearMonthStr) return '';
  const [year, month] = yearMonthStr.split('-').map(Number);
  if (!year || !month) return yearMonthStr;
  const d = new Date(year, month - 1, 1);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}
