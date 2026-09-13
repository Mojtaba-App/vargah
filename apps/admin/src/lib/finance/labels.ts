import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import 'dayjs/locale/fa';

import type { MonthlyFinancePoint } from '@vargah/business/finance';

dayjs.extend(jalaliday);

const JALALI_MONTHS_SHORT = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export function labelFinanceMonth(point: MonthlyFinancePoint): string {
  const d = dayjs(new Date(point.year, point.month, 1)).calendar('jalali');
  const monthName = JALALI_MONTHS_SHORT[d.month()] ?? '';
  return `${monthName} ${d.year()}`;
}

export function labelFinanceMonthShort(point: MonthlyFinancePoint): string {
  const d = dayjs(new Date(point.year, point.month, 1)).calendar('jalali');
  return JALALI_MONTHS_SHORT[d.month()] ?? point.key;
}
