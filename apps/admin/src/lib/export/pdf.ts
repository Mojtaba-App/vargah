import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { installJsPdfShaper } from 'bidi-shaper/jspdf';
import { render as shapeRtl } from 'bidi-shaper';

import { fetchFontAsBase64 } from './types';
import {
  cellText,
  downloadBlob,
  stampFilename,
  type ExportColumn,
  type ExportMeta,
  type ExportRow,
} from './types';

const PDF_FONT = 'NotoNaskh';

let shaperInstalled = false;

function ensureJsPdfShaper() {
  if (shaperInstalled) return;
  installJsPdfShaper(jsPDF.API);
  shaperInstalled = true;
}

/** شکل‌دهی فارسی/عربی برای جدول (autoTable از preProcessText استفاده نمی‌کند) */
function fa(value: string): string {
  if (!value) return value;
  return shapeRtl(value);
}

async function createPersianPdf() {
  ensureJsPdfShaper();
  const [regular, bold] = await Promise.all([
    fetchFontAsBase64('NotoNaskhArabic-Regular.ttf'),
    fetchFontAsBase64('NotoNaskhArabic-Bold.ttf'),
  ]);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  doc.addFileToVFS('NotoNaskhArabic-Regular.ttf', regular);
  doc.addFileToVFS('NotoNaskhArabic-Bold.ttf', bold);
  doc.addFont('NotoNaskhArabic-Regular.ttf', PDF_FONT, 'normal');
  doc.addFont('NotoNaskhArabic-Bold.ttf', PDF_FONT, 'bold');
  doc.setFont(PDF_FONT, 'normal');
  // بدون setR2L — shaping با bidi-shaper انجام می‌شود تا حروف به‌هم‌ریخته نشوند
  return doc;
}

export async function downloadPdfTable(
  columns: ExportColumn[],
  rows: ExportRow[],
  meta: ExportMeta,
) {
  const doc = await createPersianPdf();
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(14);
  doc.text(fa(meta.title), pageWidth - 40, 36, { align: 'right' });

  if (meta.subtitle) {
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(10);
    doc.text(fa(meta.subtitle), pageWidth - 40, 54, { align: 'right' });
  }

  const generatedAt = (meta.generatedAt ?? new Date()).toLocaleString('fa-IR');
  doc.setFontSize(9);
  doc.text(fa(`تاریخ خروجی: ${generatedAt}`), pageWidth - 40, 70, { align: 'right' });

  autoTable(doc, {
    startY: 84,
    head: [columns.map((col) => fa(col.header))],
    body: rows.map((row) => columns.map((col) => fa(cellText(row[col.key])))),
    styles: {
      font: PDF_FONT,
      fontStyle: 'normal',
      fontSize: 9,
      halign: 'right',
      valign: 'middle',
      cellPadding: 5,
      overflow: 'linebreak',
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: 'bold',
      fillColor: [26, 107, 102],
      textColor: 255,
      halign: 'right',
    },
    alternateRowStyles: {
      fillColor: [242, 239, 230],
    },
    margin: { left: 28, right: 28 },
  });

  const filename = meta.filename.endsWith('.pdf')
    ? meta.filename
    : stampFilename(meta.filename.replace(/\.pdf$/i, ''), 'pdf');
  doc.save(filename);
}

export async function downloadPdfFromImage(
  imageDataUrl: string,
  meta: ExportMeta,
  options?: { landscape?: boolean },
) {
  void options;
  const doc = await createPersianPdf();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(13);
  doc.text(fa(meta.title), pageWidth - 36, 32, { align: 'right' });
  if (meta.subtitle) {
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    doc.text(fa(meta.subtitle), pageWidth - 36, 48, { align: 'right' });
  }

  const top = meta.subtitle ? 60 : 44;
  const maxW = pageWidth - 56;
  const maxH = pageHeight - top - 36;
  const props = doc.getImageProperties(imageDataUrl);
  const ratio = Math.min(maxW / props.width, maxH / props.height);
  const w = props.width * ratio;
  const h = props.height * ratio;
  const x = (pageWidth - w) / 2;
  doc.addImage(imageDataUrl, 'PNG', x, top, w, h);

  const filename = meta.filename.endsWith('.pdf')
    ? meta.filename
    : stampFilename(meta.filename.replace(/\.pdf$/i, ''), 'pdf');
  doc.save(filename);
}

export async function downloadPngFromDataUrl(dataUrl: string, filename: string) {
  const name = filename.endsWith('.png') ? filename : `${filename}.png`;

  // Avoid fetch(data:) — CSRF-wrapped fetch and some browsers fail on data/blob URLs.
  if (dataUrl.startsWith('data:')) {
    const comma = dataUrl.indexOf(',');
    if (comma === -1) throw new Error('داده تصویر نامعتبر است');
    const header = dataUrl.slice(0, comma);
    const payload = dataUrl.slice(comma + 1);
    const isBase64 = /;base64/i.test(header);
    const mime = header.match(/^data:([^;,]+)/i)?.[1] ?? 'image/png';
    const binary = isBase64 ? atob(payload) : decodeURIComponent(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    downloadBlob(new Blob([bytes], { type: mime }), name);
    return;
  }

  if (dataUrl.startsWith('blob:')) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    downloadBlob(blob, name);
    return;
  }

  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = name;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}
