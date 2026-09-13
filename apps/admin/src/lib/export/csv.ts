import { cellText, downloadBlob, type ExportColumn, type ExportMeta, type ExportRow } from './types';

function escapeCsv(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvContent(
  columns: ExportColumn[],
  rows: ExportRow[],
  meta?: Pick<ExportMeta, 'title' | 'subtitle' | 'generatedAt'>,
): string {
  const lines: string[] = [];
  if (meta?.title) lines.push(`# ${meta.title}`);
  if (meta?.subtitle) lines.push(`# ${meta.subtitle}`);
  if (meta?.generatedAt) {
    lines.push(`# تاریخ خروجی: ${meta.generatedAt.toLocaleString('fa-IR')}`);
  }
  if (meta) lines.push('');

  lines.push(columns.map((col) => escapeCsv(col.header)).join(','));
  for (const row of rows) {
    lines.push(columns.map((col) => escapeCsv(cellText(row[col.key]))).join(','));
  }
  return lines.join('\r\n');
}

export function downloadCsv(
  columns: ExportColumn[],
  rows: ExportRow[],
  meta: ExportMeta,
) {
  const csv = buildCsvContent(columns, rows, {
    title: meta.title,
    subtitle: meta.subtitle,
    generatedAt: meta.generatedAt ?? new Date(),
  });
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, meta.filename.endsWith('.csv') ? meta.filename : `${meta.filename}.csv`);
}
