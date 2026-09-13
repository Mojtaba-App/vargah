import { formatJalaliDate } from '@/lib/date/jalali';

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fa-IR').format(num);
}

export function formatPrice(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 }).format(num);
}

export function formatJalali(date: Date | string, withTime = false): string {
  return formatJalaliDate(date, withTime);
}
