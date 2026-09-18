import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { installJsPdfShaper } from 'bidi-shaper/jspdf';
import { render as shapeRtl } from 'bidi-shaper';

import type { FinanceReportPayload } from '@/lib/finance/report-model';
import { fetchFontAsBase64, stampFilename } from '@/lib/export/types';
import { formatNumber, formatPrice } from '@/lib/utils';

const PDF_FONT = 'NotoNaskh';
let shaperInstalled = false;

function ensureJsPdfShaper() {
  if (shaperInstalled) return;
  installJsPdfShaper(jsPDF.API);
  shaperInstalled = true;
}

function fa(value: string): string {
  if (!value) return value;
  return shapeRtl(value);
}

function money(value: number): string {
  return `${formatPrice(value)} تومان`;
}

async function createDoc() {
  ensureJsPdfShaper();
  const [regular, bold] = await Promise.all([
    fetchFontAsBase64('NotoNaskhArabic-Regular.ttf'),
    fetchFontAsBase64('NotoNaskhArabic-Bold.ttf'),
  ]);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.addFileToVFS('NotoNaskhArabic-Regular.ttf', regular);
  doc.addFileToVFS('NotoNaskhArabic-Bold.ttf', bold);
  doc.addFont('NotoNaskhArabic-Regular.ttf', PDF_FONT, 'normal');
  doc.addFont('NotoNaskhArabic-Bold.ttf', PDF_FONT, 'bold');
  doc.setFont(PDF_FONT, 'normal');
  return doc;
}

function drawBar(
  doc: jsPDF,
  x: number,
  y: number,
  maxWidth: number,
  share: number,
  color: [number, number, number],
) {
  const width = Math.max(2, (Math.min(100, Math.max(0, share)) / 100) * maxWidth);
  doc.setFillColor(226, 232, 240);
  doc.roundedRect(x, y, maxWidth, 10, 3, 3, 'F');
  doc.setFillColor(...color);
  doc.roundedRect(x, y, width, 10, 3, 3, 'F');
}

function wrapFa(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 16) {
  const lines = doc.splitTextToSize(fa(text), maxWidth) as string[];
  lines.forEach((line, index) => {
    doc.text(line, x, y + index * lineHeight, { align: 'right' });
  });
  return lines.length * lineHeight;
}

export async function downloadFinanceReportPdf(payload: FinanceReportPayload) {
  const doc = await createDoc();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const right = pageWidth - 40;
  const left = 40;
  const contentWidth = pageWidth - 80;

  // Cover header
  doc.setFillColor(26, 107, 102);
  doc.rect(0, 0, pageWidth, 92, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(18);
  doc.text(fa(payload.title), right, 40, { align: 'right' });
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(11);
  doc.text(fa(payload.subtitle), right, 60, { align: 'right' });
  doc.setFontSize(9);
  doc.text(fa(`تاریخ خروجی: ${payload.generatedAt.toLocaleString('fa-IR')}`), right, 78, {
    align: 'right',
  });

  let y = 118;
  doc.setTextColor(15, 23, 42);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(13);
  doc.text(fa('خلاصه عملکرد مالی'), right, y, { align: 'right' });
  y += 14;
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(10);
  y += wrapFa(doc, payload.narrative.intro, right, y, contentWidth) + 10;

  const cards: Array<{ label: string; value: string; color: [number, number, number] }> = [
    {
      label: 'درآمد ماه',
      value: money(payload.summary.monthlyIncome.total),
      color: [16, 185, 129],
    },
    {
      label: 'هزینه ماه',
      value: money(payload.summary.monthlyExpense),
      color: [244, 63, 94],
    },
    {
      label: 'سود / خالص',
      value: money(payload.summary.monthlyNet),
      color: payload.summary.monthlyNet >= 0 ? [79, 70, 229] : [244, 63, 94],
    },
    {
      label: 'کل درآمد',
      value: money(payload.summary.totalPaidAllTime),
      color: [26, 107, 102],
    },
  ];

  const cardW = (contentWidth - 18) / 2;
  cards.forEach((card, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = left + col * (cardW + 18);
    const cy = y + row * 58;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cy, cardW, 50, 8, 8, 'FD');
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(fa(card.label), x + cardW - 12, cy + 18, { align: 'right' });
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...card.color);
    doc.text(fa(card.value), x + cardW - 12, cy + 36, { align: 'right' });
  });
  y += 130;

  doc.setTextColor(15, 23, 42);
  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(12);
  doc.text(fa('ترکیب درآمد ماه (شماتیک)'), right, y, { align: 'right' });
  y += 18;

  const barColors: Record<string, [number, number, number]> = {
    SUBSCRIPTION: [99, 102, 241],
    ADVERTISEMENT: [6, 182, 212],
    OTHER: [148, 163, 184],
  };

  payload.typeBreakdown.forEach((row) => {
    doc.setFont(PDF_FONT, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(fa(`${row.label} — ${money(row.amount)} (${formatNumber(row.share)}٪)`), right, y, {
      align: 'right',
    });
    y += 8;
    drawBar(doc, left, y, contentWidth, row.share, barColors[row.type] ?? [148, 163, 184]);
    y += 22;
  });

  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  y += wrapFa(doc, payload.narrative.monthlyInsight, right, y, contentWidth) + 8;
  y += wrapFa(doc, payload.narrative.mixInsight, right, y, contentWidth) + 12;

  if (y > pageHeight - 160) {
    doc.addPage();
    y = 48;
  }

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(fa('روند ۶ ماهه درآمد، هزینه و خالص'), right, y, { align: 'right' });
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [[fa('ماه'), fa('درآمد'), fa('هزینه'), fa('خالص'), fa('اشتراک'), fa('تبلیغات')]],
    body: payload.trend.map((point) => [
      fa(point.label),
      fa(formatPrice(point.income)),
      fa(formatPrice(point.expense)),
      fa(formatPrice(point.net)),
      fa(formatPrice(point.subscription)),
      fa(formatPrice(point.advertisement)),
    ]),
    styles: {
      font: PDF_FONT,
      fontStyle: 'normal',
      fontSize: 8,
      halign: 'right',
      cellPadding: 4,
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: 'bold',
      fillColor: [26, 107, 102],
      textColor: 255,
      halign: 'right',
    },
    alternateRowStyles: { fillColor: [242, 239, 230] },
    margin: { left: 40, right: 40 },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 18;

  if (y > pageHeight - 120) {
    doc.addPage();
    y = 48;
  }

  doc.setFont(PDF_FONT, 'bold');
  doc.setFontSize(12);
  doc.text(fa('وضعیت پرداخت‌ها'), right, y, { align: 'right' });
  y += 10;

  autoTable(doc, {
    startY: y,
    head: [[fa('وضعیت'), fa('تعداد'), fa('مبلغ')]],
    body: payload.statusBreakdown.map((row) => [
      fa(row.label),
      fa(formatNumber(row.count)),
      fa(formatPrice(row.amount)),
    ]),
    styles: {
      font: PDF_FONT,
      fontStyle: 'normal',
      fontSize: 9,
      halign: 'right',
      cellPadding: 5,
    },
    headStyles: {
      font: PDF_FONT,
      fontStyle: 'bold',
      fillColor: [26, 107, 102],
      textColor: 255,
      halign: 'right',
    },
    margin: { left: 40, right: 40 },
  });

  y = ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y) + 16;
  doc.setFont(PDF_FONT, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  y += wrapFa(doc, payload.narrative.cashflowInsight, right, y, contentWidth) + 8;
  y += wrapFa(doc, payload.narrative.closing, right, y, contentWidth) + 14;

  if (payload.transactions.length > 0) {
    if (y > pageHeight - 120) {
      doc.addPage();
      y = 48;
    }
    doc.setFont(PDF_FONT, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(fa('نمونه تراکنش‌های گزارش'), right, y, { align: 'right' });
    y += 8;

    autoTable(doc, {
      startY: y,
      head: [[fa('نوع'), fa('مبلغ'), fa('وضعیت'), fa('مشتری'), fa('تاریخ')]],
      body: payload.transactions
        .slice(0, 40)
        .map((tx) => [
          fa(tx.type),
          fa(formatPrice(tx.amount)),
          fa(tx.status),
          fa(tx.customer),
          fa(tx.paidAt || '—'),
        ]),
      styles: {
        font: PDF_FONT,
        fontStyle: 'normal',
        fontSize: 8,
        halign: 'right',
        cellPadding: 3,
      },
      headStyles: {
        font: PDF_FONT,
        fontStyle: 'bold',
        fillColor: [26, 107, 102],
        textColor: 255,
        halign: 'right',
      },
      alternateRowStyles: { fillColor: [242, 239, 230] },
      margin: { left: 40, right: 40 },
    });
  }

  doc.save(stampFilename('finance-report', 'pdf'));
}
