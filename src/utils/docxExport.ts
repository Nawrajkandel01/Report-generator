import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  ImageRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Footer,
  PageNumber,
  PageOrientation,
  TableLayoutType,
} from 'docx';
import { DailyLogEntry, PhotoItem, ReportHeaderSettings } from '../types';
import { dataUrlToUint8Array, formatReportDate, formatMonthYear } from './imageUtils';

// Standard A4 page dimensions in DXA (twips: 1/20 point, 1440 twips = 1 inch, 1 mm ≈ 56.6929 twips)
// 210 mm = 11906 dxa, 297 mm = 16838 dxa
const A4_PAGE_WIDTH = 11906;
const A4_PAGE_HEIGHT = 16838;

// Balanced margins: 0.5 in (720 dxa = 12.7 mm) on all 4 sides
const MARGIN_TOP = 720;
const MARGIN_BOTTOM = 720;
const MARGIN_LEFT = 720;
const MARGIN_RIGHT = 720;

// Usable printable width between left and right margins
// 11906 - 720 - 720 = 10466 dxa (7.268 inches = 184.6 mm)
const USABLE_WIDTH = A4_PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

/**
 * Calculates scaled dimensions within a maximum bounding box while strictly preserving aspect ratio.
 */
function computeImageDimensions(
  naturalWidth: number | undefined,
  naturalHeight: number | undefined,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  if (!naturalWidth || !naturalHeight || naturalWidth <= 0 || naturalHeight <= 0) {
    return { width: maxW, height: maxH };
  }

  const ratio = naturalWidth / naturalHeight;
  const targetRatio = maxW / maxH;

  if (ratio >= targetRatio) {
    // Image is wider than bounding box -> constrain by width
    const width = maxW;
    const height = Math.max(1, Math.round(maxW / ratio));
    return { width, height };
  } else {
    // Image is taller than bounding box -> constrain by height
    const height = maxH;
    const width = Math.max(1, Math.round(maxH * ratio));
    return { width, height };
  }
}

/**
 * Resolves natural dimensions for an image either from stored metadata or from dataUrl.
 */
async function resolvePhotoDimensions(
  photo: PhotoItem,
  defaultW = 4,
  defaultH = 3
): Promise<{ width: number; height: number }> {
  if (photo.width && photo.height && photo.width > 0 && photo.height > 0) {
    return { width: photo.width, height: photo.height };
  }

  if (typeof Image !== 'undefined' && photo.dataUrl) {
    try {
      return await new Promise<{ width: number; height: number }>((resolve) => {
        const img = new Image();
        img.onload = () => {
          if (img.naturalWidth && img.naturalHeight) {
            resolve({ width: img.naturalWidth, height: img.naturalHeight });
          } else {
            resolve({ width: defaultW, height: defaultH });
          }
        };
        img.onerror = () => resolve({ width: defaultW, height: defaultH });
        img.src = photo.dataUrl;
      });
    } catch {
      return { width: defaultW, height: defaultH };
    }
  }

  return { width: defaultW, height: defaultH };
}

export async function generateWordDocument(
  entries: DailyLogEntry[],
  settings: ReportHeaderSettings,
  selectedMonth: string // 'YYYY-MM' or 'all'
): Promise<Blob> {
  const filteredEntries =
    selectedMonth === 'all'
      ? entries
      : entries.filter((e) => e.date.startsWith(selectedMonth));

  // Sort chronologically ascending for reports
  filteredEntries.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

  const monthLabel =
    selectedMonth === 'all'
      ? 'ALL MONTHS'
      : formatMonthYear(selectedMonth).toUpperCase();

  const formattedReportTitle = `${settings.reportTitle} – ${monthLabel}`;

  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: '000000',
  };

  const bordersAll = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const noBorders = {
    top: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    left: { style: BorderStyle.NONE, size: 0, color: 'auto' },
    right: { style: BorderStyle.NONE, size: 0, color: 'auto' },
  };

  // Header Table Column allocation across USABLE_WIDTH (10466 dxa):
  // Left logo/brand column: 6150 dxa (approx 58.8% to fit company title & subtitle cleanly)
  // Meta keys column: 1680 dxa (approx 16.0%)
  // Meta values column: 2636 dxa (approx 25.2%)
  // Total: 6150 + 1680 + 2636 = 10466 dxa (fits exactly 100% of usable width)
  const headerColWidths = [6150, 1680, 2636];

  const headerTable = new Table({
    width: { size: USABLE_WIDTH, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    layout: TableLayoutType.FIXED,
    columnWidths: headerColWidths,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 6150, type: WidthType.DXA },
            rowSpan: 4,
            verticalAlign: 'center',
            borders: bordersAll,
            margins: { top: 100, bottom: 100, left: 140, right: 140 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: settings.companyName,
                    bold: true,
                    size: 40, // 20pt
                    color: '1A365D', // Navy Blue
                    font: 'Arial',
                  }),
                  new TextRun({
                    text: ' ',
                    size: 28,
                  }),
                  new TextRun({
                    text: settings.companySubtitle,
                    italics: true,
                    bold: true,
                    size: 24, // 12pt
                    color: '2B6CB0',
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 1680, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Document:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2636, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: settings.docNumber, size: 18, font: 'Arial' })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1680, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Date:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2636, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: settings.reportDate || formatReportDate(new Date().toISOString().split('T')[0]),
                    size: 18,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1680, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Rev No.:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2636, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: settings.revNumber, size: 18, font: 'Arial' })],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1680, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Page:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2636, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'Page ', size: 18, font: 'Arial' }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: 'Arial',
                  }),
                  new TextRun({ text: ' of ', size: 18, font: 'Arial' }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      // Bottom banner row (title row) spanning all 3 columns
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            width: { size: USABLE_WIDTH, type: WidthType.DXA },
            borders: bordersAll,
            margins: { top: 80, bottom: 80, left: 100, right: 100 },
            shading: {
              type: ShadingType.CLEAR,
              fill: 'F7FAFC',
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: formattedReportTitle,
                    bold: true,
                    size: 20, // 10pt
                    font: 'Arial',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const bodyChildren: (Paragraph | Table)[] = [headerTable];

  // Helper to chunk array
  function chunkArray<T>(arr: T[], size: number): T[][] {
    const res: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size));
    }
    return res;
  }

  // Generate sections for each daily entry
  for (let i = 0; i < filteredEntries.length; i++) {
    const entry = filteredEntries[i];
    const sectionTitleText = `${entry.location}  ${formatReportDate(entry.date)}`;

    // Top spacing before section
    bodyChildren.push(
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [],
      })
    );

    // Gray section header table matching exact USABLE_WIDTH and centered
    const sectionBarTable = new Table({
      width: { size: USABLE_WIDTH, type: WidthType.DXA },
      alignment: AlignmentType.CENTER,
      layout: TableLayoutType.FIXED,
      columnWidths: [USABLE_WIDTH],
      borders: noBorders,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: USABLE_WIDTH, type: WidthType.DXA },
              borders: noBorders,
              shading: {
                type: ShadingType.CLEAR,
                fill: 'D2D6DC', // Gray highlight banner
              },
              margins: {
                top: 80,
                bottom: 80,
                left: 140,
                right: 140,
              },
              children: [
                new Paragraph({
                  alignment: AlignmentType.LEFT,
                  children: [
                    new TextRun({
                      text: sectionTitleText,
                      bold: true,
                      size: 20,
                      font: 'Arial',
                      color: '111827',
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    });

    bodyChildren.push(sectionBarTable);

    // Spacing between bar and photos
    bodyChildren.push(
      new Paragraph({
        spacing: { before: 100, after: 100 },
        children: [],
      })
    );

    // Photos grid: 3 per row (default) or 2 per row
    const photosPerRow = settings.photosPerRow || 3;
    const photoRows = chunkArray(entry.photos, photosPerRow);

    if (entry.photos.length > 0) {
      const tableRows: TableRow[] = [];

      // Calculate column widths that strictly sum to USABLE_WIDTH
      const colWidths: number[] = [];
      const baseColWidth = Math.floor(USABLE_WIDTH / photosPerRow);
      for (let c = 0; c < photosPerRow; c++) {
        if (c === photosPerRow - 1) {
          colWidths.push(USABLE_WIDTH - baseColWidth * (photosPerRow - 1));
        } else {
          colWidths.push(baseColWidth);
        }
      }

      // Max image dimensions in pixels (at 96 DPI: 1 px ≈ 15 dxa)
      // Cell usable width is ~224 px for 3 cols, ~340 px for 2 cols
      const maxImgW = photosPerRow === 3 ? 216 : 320;
      const maxImgH = photosPerRow === 3 ? 162 : 240;

      for (const rowPhotos of photoRows) {
        const cells: TableCell[] = [];

        for (let col = 0; col < photosPerRow; col++) {
          const photo = rowPhotos[col];
          const cellWidth = colWidths[col];

          if (photo) {
            try {
              const imageBytes = dataUrlToUint8Array(photo.dataUrl);
              const naturalDims = await resolvePhotoDimensions(photo);
              const scaledDims = computeImageDimensions(
                naturalDims.width,
                naturalDims.height,
                maxImgW,
                maxImgH
              );

              cells.push(
                new TableCell({
                  width: { size: cellWidth, type: WidthType.DXA },
                  borders: noBorders,
                  margins: { top: 60, bottom: 60, left: 40, right: 40 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: imageBytes,
                          transformation: {
                            width: scaledDims.width,
                            height: scaledDims.height,
                          },
                          type: 'jpg',
                        }),
                      ],
                    }),
                  ],
                })
              );
            } catch (err) {
              console.warn('Failed to embed photo in docx:', err);
              cells.push(
                new TableCell({
                  width: { size: cellWidth, type: WidthType.DXA },
                  borders: noBorders,
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [new TextRun({ text: '[Photo error]', size: 16 })],
                    }),
                  ],
                })
              );
            }
          } else {
            // Empty placeholder cell to maintain multi-column table alignment
            cells.push(
              new TableCell({
                width: { size: cellWidth, type: WidthType.DXA },
                borders: noBorders,
                children: [new Paragraph({ children: [] })],
              })
            );
          }
        }

        tableRows.push(new TableRow({ children: cells }));
      }

      const photoTable = new Table({
        width: { size: USABLE_WIDTH, type: WidthType.DXA },
        alignment: AlignmentType.CENTER,
        layout: TableLayoutType.FIXED,
        columnWidths: colWidths,
        borders: noBorders,
        rows: tableRows,
      });

      bodyChildren.push(photoTable);
    } else {
      bodyChildren.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 120, after: 120 },
          children: [
            new TextRun({
              text: 'No photos logged for this entry.',
              italics: true,
              size: 18,
              color: '6B7280',
            }),
          ],
        })
      );
    }

    // Optional page break between days if setting is enabled
    if (settings.pageBreakPerLocation && i < filteredEntries.length - 1) {
      bodyChildren.push(
        new Paragraph({
          pageBreakBefore: true,
          children: [],
        })
      );
    }
  }

  // Footer with document and page info aligned cleanly with margins
  const footer = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [
          new TextRun({
            text: `${settings.companyName} ${settings.companySubtitle} • ${settings.docNumber} • Page `,
            size: 16,
            color: '718096',
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: 16,
            color: '718096',
          }),
          new TextRun({
            text: ' of ',
            size: 16,
            color: '718096',
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: 16,
            color: '718096',
          }),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: A4_PAGE_WIDTH,
              height: A4_PAGE_HEIGHT,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: {
              top: MARGIN_TOP,
              bottom: MARGIN_BOTTOM,
              left: MARGIN_LEFT,
              right: MARGIN_RIGHT,
            },
          },
        },
        footers: {
          default: footer,
        },
        children: bodyChildren,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

