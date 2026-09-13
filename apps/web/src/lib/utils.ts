export function formatPrice(amount: number, locale = 'fa-IR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number, locale = 'fa-IR'): string {
  return new Intl.NumberFormat(locale).format(num);
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
