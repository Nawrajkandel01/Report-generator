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
  Header,
  Footer,
  PageNumber,
  HeadingLevel,
} from 'docx';
import { DailyLogEntry, ReportHeaderSettings } from '../types';
import { dataUrlToUint8Array, formatReportDate, formatMonthYear } from './imageUtils';

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

  // Build the Header Table exactly matching IMG_4425.PNG
  // Total table width: 9360 dxa (6.5 inches)
  // Left logo/brand column: 5500 dxa (span 4 rows)
  // Meta keys column: 1500 dxa
  // Meta values column: 2360 dxa
  const headerTable = new Table({
    width: { size: 9360, type: WidthType.DXA },
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 5500, type: WidthType.DXA },
            rowSpan: 4,
            verticalAlign: 'center',
            borders: bordersAll,
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
            width: { size: 1500, type: WidthType.DXA },
            borders: bordersAll,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Document:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2360, type: WidthType.DXA },
            borders: bordersAll,
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
            width: { size: 1500, type: WidthType.DXA },
            borders: bordersAll,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Date:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2360, type: WidthType.DXA },
            borders: bordersAll,
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
            width: { size: 1500, type: WidthType.DXA },
            borders: bordersAll,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Rev No.:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2360, type: WidthType.DXA },
            borders: bordersAll,
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
            width: { size: 1500, type: WidthType.DXA },
            borders: bordersAll,
            children: [
              new Paragraph({
                children: [new TextRun({ text: 'Page:', size: 18, font: 'Arial' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 2360, type: WidthType.DXA },
            borders: bordersAll,
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
      // Bottom banner row
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            width: { size: 9360, type: WidthType.DXA },
            borders: bordersAll,
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

    // Top spacing
    bodyChildren.push(
      new Paragraph({
        spacing: { before: 240, after: 120 },
        children: [],
      })
    );

    // Gray section header table or paragraph (IMG_4425 has gray shaded highlight banner)
    const sectionBarTable = new Table({
      width: { size: 9360, type: WidthType.DXA },
      alignment: AlignmentType.LEFT,
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 9360, type: WidthType.DXA },
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

    // Photos grid: 3 per row (matches user screenshots)
    const photosPerRow = settings.photosPerRow || 3;
    const photoRows = chunkArray(entry.photos, photosPerRow);

    if (entry.photos.length > 0) {
      const tableRows: TableRow[] = [];

      for (const rowPhotos of photoRows) {
        const cells: TableCell[] = [];
        const cellWidth = Math.floor(9360 / photosPerRow);

        for (let col = 0; col < photosPerRow; col++) {
          const photo = rowPhotos[col];
          if (photo) {
            try {
              const imageBytes = dataUrlToUint8Array(photo.dataUrl);
              cells.push(
                new TableCell({
                  width: { size: cellWidth, type: WidthType.DXA },
                  borders: noBorders,
                  margins: { top: 60, bottom: 60, left: 60, right: 60 },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: imageBytes,
                          transformation: {
                            width: photosPerRow === 3 ? 196 : 300,
                            height: photosPerRow === 3 ? 165 : 225,
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
                      children: [new TextRun({ text: '[Photo error]', size: 16 })],
                    }),
                  ],
                })
              );
            }
          } else {
            // Empty placeholder cell to maintain 3-column table alignment
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
        width: { size: 9360, type: WidthType.DXA },
        alignment: AlignmentType.CENTER,
        rows: tableRows,
      });

      bodyChildren.push(photoTable);
    } else {
      bodyChildren.push(
        new Paragraph({
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

  // Footer with document and page info
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
            margin: {
              top: 720, // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720,
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
