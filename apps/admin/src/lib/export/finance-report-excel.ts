import ExcelJS from 'exceljs';

import type { FinanceReportPayload } from '@/lib/finance/report-model';
import { downloadBlob, stampFilename } from '@/lib/export/types';
import { formatNumber, formatPrice } from '@/lib/utils';

const BRAND = 'FF1A6B66';
const INCOME = 'FF059669';
const EXPENSE = 'FFE11D48';
const NET = 'FF4F46E5';
const ZEBRA = 'FFF2EFE6';

function money(value: number): string {
  return `${formatPrice(value)} تومان`;
}

function styleTitle(cell: ExcelJS.Cell, text: string) {
  cell.value = text;
  cell.font = { name: 'Vazirmatn', size: 16, bold: true, color: { argb: 'FF0F172A' } };
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
}

function styleHeaderRow(row: ExcelJS.Row, count: number) {
  for (let i = 1; i <= count; i += 1) {
    const cell = row.getCell(i);
    cell.font = { name: 'Vazirmatn', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
  }
  row.height = 22;
}

function addKpi(sheet: ExcelJS.Worksheet, row: number, label: string, value: string, color: string) {
  const labelCell = sheet.getCell(row, 1);
  const valueCell = sheet.getCell(row, 2);
  labelCell.value = label;
  valueCell.value = value;
  labelCell.font = { name: 'Vazirmatn', size: 11, color: { argb: 'FF64748B' } };
  valueCell.font = { name: 'Vazirmatn', size: 13, bold: true, color: { argb: color } };
  labelCell.alignment = { horizontal: 'right' };
  valueCell.alignment = { horizontal: 'right' };
}

/** شماتیک میله‌ای ساده با بلوک‌های رنگی در سلول‌ها */
function addBarSchematic(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  label: string,
  share: number,
  color: string,
) {
  sheet.getCell(startRow, 1).value = label;
  sheet.getCell(startRow, 1).font = { name: 'Vazirmatn', size: 11 };
  sheet.getCell(startRow, 1).alignment = { horizontal: 'right' };

  const blocks = Math.max(0, Math.min(20, Math.round(share / 5)));
  for (let i = 0; i < 20; i += 1) {
    const cell = sheet.getCell(startRow, 2 + i);
    if (i < blocks) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    }
    sheet.getColumn(2 + i).width = 2.2;
  }
  sheet.getCell(startRow, 22).value = `${formatNumber(share)}٪`;
  sheet.getCell(startRow, 22).font = { name: 'Vazirmatn', bold: true };
  sheet.getCell(startRow, 22).alignment = { horizontal: 'right' };
}

export async function downloadFinanceReportExcel(payload: FinanceReportPayload) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'وارگه';
  workbook.created = payload.generatedAt;

  // ── داشبورد ──────────────────────────────────────────────
  const dash = workbook.addWorksheet('داشبورد', { views: [{ rightToLeft: true }] });
  dash.getColumn(1).width = 28;
  dash.getColumn(2).width = 28;

  styleTitle(dash.getCell(1, 1), payload.title);
  dash.mergeCells(1, 1, 1, 2);
  dash.getCell(2, 1).value = payload.subtitle;
  dash.getCell(2, 1).font = { name: 'Vazirmatn', size: 11, color: { argb: 'FF64748B' } };
  dash.mergeCells(2, 1, 2, 2);
  dash.getCell(3, 1).value = `تاریخ خروجی: ${payload.generatedAt.toLocaleString('fa-IR')}`;
  dash.getCell(3, 1).font = { name: 'Vazirmatn', size: 10, color: { argb: 'FF94A3B8' } };

  dash.getCell(5, 1).value = 'شاخص‌های کلیدی';
  dash.getCell(5, 1).font = { name: 'Vazirmatn', size: 13, bold: true, color: { argb: BRAND } };

  addKpi(dash, 6, 'درآمد ماه جاری', money(payload.summary.monthlyIncome.total), INCOME);
  addKpi(dash, 7, 'هزینه ماه (بازگشت)', money(payload.summary.monthlyExpense), EXPENSE);
  addKpi(
    dash,
    8,
    'سود / خالص ماه',
    money(payload.summary.monthlyNet),
    payload.summary.monthlyNet >= 0 ? NET : EXPENSE,
  );
  addKpi(dash, 9, 'کل درآمد پرداخت‌شده', money(payload.summary.totalPaidAllTime), BRAND);
  addKpi(dash, 10, 'اشتراک (ماه)', money(payload.summary.monthlyIncome.subscription), 'FF4F46E5');
  addKpi(dash, 11, 'تبلیغات (ماه)', money(payload.summary.monthlyIncome.advertisement), 'FF0891B2');
  addKpi(dash, 12, 'سایر (ماه)', money(payload.summary.monthlyIncome.other), 'FF64748B');
  addKpi(dash, 13, 'در انتظار', money(payload.summary.totalPending), 'FFD97706');
  addKpi(dash, 14, 'ناموفق', money(payload.summary.totalFailed), EXPENSE);
  addKpi(dash, 15, 'بازگشت وجه (کل)', money(payload.summary.totalRefundedAllTime), 'FF7C3AED');

  dash.getCell(17, 1).value = 'شماتیک ترکیب درآمد ماه';
  dash.getCell(17, 1).font = { name: 'Vazirmatn', size: 13, bold: true, color: { argb: BRAND } };
  payload.typeBreakdown.forEach((row, index) => {
    const color =
      row.type === 'SUBSCRIPTION' ? 'FF6366F1' : row.type === 'ADVERTISEMENT' ? 'FF06B6D4' : 'FF94A3B8';
    addBarSchematic(dash, 18 + index, row.label, row.share, color);
  });

  dash.getCell(22, 1).value = 'توضیحات تحلیلی';
  dash.getCell(22, 1).font = { name: 'Vazirmatn', size: 13, bold: true, color: { argb: BRAND } };
  const notes = [
    payload.narrative.intro,
    payload.narrative.monthlyInsight,
    payload.narrative.mixInsight,
    payload.narrative.cashflowInsight,
    payload.narrative.closing,
  ];
  notes.forEach((text, index) => {
    const cell = dash.getCell(23 + index, 1);
    cell.value = text;
    cell.font = { name: 'Vazirmatn', size: 10 };
    cell.alignment = { horizontal: 'right', wrapText: true, vertical: 'top' };
    dash.mergeCells(23 + index, 1, 23 + index, 22);
    dash.getRow(23 + index).height = 42;
  });

  // ── روند ماهانه ──────────────────────────────────────────
  const trendSheet = workbook.addWorksheet('روند ماهانه', { views: [{ rightToLeft: true }] });
  ['ماه', 'درآمد', 'هزینه', 'خالص', 'اشتراک', 'تبلیغات'].forEach((h, i) => {
    trendSheet.getCell(1, i + 1).value = h;
  });
  styleHeaderRow(trendSheet.getRow(1), 6);
  [18, 16, 16, 16, 16, 16].forEach((w, i) => {
    trendSheet.getColumn(i + 1).width = w;
  });
  payload.trend.forEach((point, index) => {
    const row = trendSheet.getRow(2 + index);
    row.values = [
      point.label,
      point.income,
      point.expense,
      point.net,
      point.subscription,
      point.advertisement,
    ];
    row.eachCell((cell) => {
      cell.font = { name: 'Vazirmatn', size: 11 };
      cell.alignment = { horizontal: 'right' };
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
      }
    });
  });

  // ── وضعیت پرداخت ─────────────────────────────────────────
  const statusSheet = workbook.addWorksheet('وضعیت پرداخت', { views: [{ rightToLeft: true }] });
  ['وضعیت', 'تعداد', 'مبلغ'].forEach((h, i) => {
    statusSheet.getCell(1, i + 1).value = h;
  });
  styleHeaderRow(statusSheet.getRow(1), 3);
  [18, 12, 18].forEach((w, i) => {
    statusSheet.getColumn(i + 1).width = w;
  });
  payload.statusBreakdown.forEach((row, index) => {
    const excelRow = statusSheet.getRow(2 + index);
    excelRow.values = [row.label, row.count, row.amount];
    excelRow.eachCell((cell) => {
      cell.font = { name: 'Vazirmatn', size: 11 };
      cell.alignment = { horizontal: 'right' };
    });
  });

  // ── تراکنش‌ها ────────────────────────────────────────────
  const txSheet = workbook.addWorksheet('تراکنش‌ها', { views: [{ rightToLeft: true }] });
  ['نوع', 'مبلغ', 'وضعیت', 'درگاه', 'مشتری', 'تاریخ پرداخت', 'شناسه'].forEach((h, i) => {
    txSheet.getCell(1, i + 1).value = h;
  });
  styleHeaderRow(txSheet.getRow(1), 7);
  [14, 14, 12, 12, 22, 18, 24].forEach((w, i) => {
    txSheet.getColumn(i + 1).width = w;
  });
  payload.transactions.forEach((tx, index) => {
    const row = txSheet.getRow(2 + index);
    row.values = [tx.type, tx.amount, tx.status, tx.gateway, tx.customer, tx.paidAt, tx.id];
    row.eachCell((cell) => {
      cell.font = { name: 'Vazirmatn', size: 10 };
      cell.alignment = { horizontal: 'right', wrapText: true };
      if (index % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  downloadBlob(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    stampFilename('finance-report', 'xlsx'),
  );
}
