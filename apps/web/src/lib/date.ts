import dayjs from 'dayjs';
import jalaliday from 'jalaliday';

dayjs.extend(jalaliday);

export function formatJalaliDate(date: Date | string | number, format = 'D MMMM YYYY') {
  return dayjs(date).calendar('jalali').locale('fa').format(format);
}

/** Date از Prisma یا string بعد از unstable_cache */
export function toIsoString(value: Date | string | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return new Date(value).toISOString();
}

export { dayjs };
