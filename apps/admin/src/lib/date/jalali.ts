import dayjs from 'dayjs';
import jalaliday from 'jalaliday';
import 'dayjs/locale/fa';

dayjs.extend(jalaliday);
dayjs.locale('fa');

export type JalaliDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export type JalaliDateParts = {
  year: number;
  month: number;
  day: number;
};

export type JalaliDateBoundary = 'start' | 'end';

export const JALALI_MONTHS = [
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

export function formatJalaliDate(
  date: Date | string | number | null | undefined,
  withTime = false,
): string {
  if (!date) return '—';
  const format = withTime ? 'D MMMM YYYY، HH:mm' : 'D MMMM YYYY';
  return dayjs(date).calendar('jalali').locale('fa').format(format);
}

export function isoToJalaliDateParts(iso?: string | null): JalaliDateParts | null {
  if (!iso) return null;
  const parsed = dayjs(iso);
  if (!parsed.isValid()) return null;
  const jalali = parsed.calendar('jalali');
  return {
    year: jalali.year(),
    month: jalali.month() + 1,
    day: jalali.date(),
  };
}

export function getTodayJalaliParts(): JalaliDateParts {
  const jalali = dayjs().calendar('jalali');
  return { year: jalali.year(), month: jalali.month() + 1, day: jalali.date() };
}

export function addJalaliDays(parts: JalaliDateParts, days: number): JalaliDateParts {
  const shifted = dayjs()
    .calendar('jalali')
    .year(parts.year)
    .month(parts.month - 1)
    .date(parts.day)
    .add(days, 'day');
  const jalali = shifted.calendar('jalali');
  return { year: jalali.year(), month: jalali.month() + 1, day: jalali.date() };
}

export function jalaliDatePartsToIso(
  parts: JalaliDateParts,
  boundary: JalaliDateBoundary = 'end',
): string {
  const jalali = dayjs()
    .calendar('jalali')
    .year(parts.year)
    .month(parts.month - 1)
    .date(parts.day);

  const gregory = jalali.calendar('gregory');
  if (boundary === 'end') {
    return gregory.hour(23).minute(59).second(59).millisecond(999).toDate().toISOString();
  }
  return gregory.startOf('day').toDate().toISOString();
}

export function formatJalaliDateParts(parts: JalaliDateParts): string {
  return `${parts.year}/${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')}`;
}

export function isIsoBefore(iso: string, minIso: string): boolean {
  return dayjs(iso).isBefore(dayjs(minIso));
}

export function isIsoAfter(iso: string, maxIso: string): boolean {
  return dayjs(iso).isAfter(dayjs(maxIso));
}

export function isoToJalaliParts(iso?: string | null): JalaliDateTimeParts | null {
  if (!iso) return null;
  const parsed = dayjs(iso);
  if (!parsed.isValid()) return null;
  const jalali = parsed.calendar('jalali');
  return {
    year: jalali.year(),
    month: jalali.month() + 1,
    day: jalali.date(),
    hour: parsed.hour(),
    minute: parsed.minute(),
  };
}

export function jalaliPartsToIso(parts: JalaliDateTimeParts): string {
  const jalali = dayjs()
    .calendar('jalali')
    .year(parts.year)
    .month(parts.month - 1)
    .date(parts.day)
    .hour(parts.hour)
    .minute(parts.minute)
    .second(0)
    .millisecond(0);

  return jalali.calendar('gregory').toDate().toISOString();
}

export function getJalaliYearOptions(anchorYear?: number) {
  const current = anchorYear ?? dayjs().calendar('jalali').year();
  const start = current - 50;
  return Array.from({ length: 100 }, (_, i) => start + i);
}

export function getDaysInJalaliMonth(year: number, month: number) {
  const first = dayjs()
    .calendar('jalali')
    .year(year)
    .month(month - 1)
    .date(1);
  const nextMonth = first.add(1, 'month');
  return nextMonth.diff(first, 'day');
}

export function formatJalaliParts(parts: JalaliDateTimeParts): string {
  return `${parts.year}/${String(parts.month).padStart(2, '0')}/${String(parts.day).padStart(2, '0')} ${String(parts.hour).padStart(2, '0')}:${String(parts.minute).padStart(2, '0')}`;
}

export function formatGregorianDate(
  date: Date | string | number | null | undefined,
  withTime = false,
): string {
  if (!date) return '—';
  const format = withTime ? 'D MMMM YYYY, HH:mm' : 'D MMMM YYYY';
  return dayjs(date).locale('en').format(format);
}

export { dayjs };
