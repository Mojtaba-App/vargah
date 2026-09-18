import ExcelJS from 'exceljs';

import {
  cellText,
  downloadBlob,
  stampFilename,
  type ExportColumn,
  type ExportMeta,
  type ExportRow,
} from './types';

export async function downloadExcel(columns: ExportColumn[], rows: ExportRow[], meta: ExportMeta) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'وارگه';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(meta.title.slice(0, 31) || 'گزارش', {
    views: [{ rightToLeft: true }],
  });

  sheet.mergeCells(1, 1, 1, columns.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = meta.title;
  titleCell.font = { name: 'Vazirmatn', size: 14, bold: true };
  titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

  if (meta.subtitle) {
    sheet.mergeCells(2, 1, 2, columns.length);
    const subtitleCell = sheet.getCell(2, 1);
    subtitleCell.value = meta.subtitle;
    subtitleCell.font = { name: 'Vazirmatn', size: 11 };
    subtitleCell.alignment = { horizontal: 'right' };
  }

  const headerRowIndex = meta.subtitle ? 4 : 3;
  const headerRow = sheet.getRow(headerRowIndex);
  columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col.header;
    cell.font = { name: 'Vazirmatn', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A6B66' },
    };
    cell.alignment = { horizontal: 'right', vertical: 'middle' };
    sheet.getColumn(index + 1).width = col.width ?? Math.max(14, col.header.length + 4);
  });
  headerRow.height = 22;

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex);
    columns.forEach((col, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1);
      cell.value = cellText(row[col.key]);
      cell.font = { name: 'Vazirmatn', size: 11 };
      cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
      if (rowIndex % 2 === 1) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2EFE6' },
        };
      }
    });
  });

  sheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: columns.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const filename = meta.filename.endsWith('.xlsx')
    ? meta.filename
    : stampFilename(meta.filename.replace(/\.xlsx$/i, ''), 'xlsx');
  downloadBlob(blob, filename);
}
