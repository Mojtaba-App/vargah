const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** تعداد روزهای باقی‌مانده تا تاریخ (گرد به بالا) */
export function daysUntil(date: Date, now = new Date()): number {
  return Math.ceil((date.getTime() - now.getTime()) / MS_PER_DAY);
}

/** آیا یادآور انقضای اشتراک باید ارسال شود؟ */
export function shouldSendExpiryReminder(daysRemaining: number, targetDay: 7 | 1): boolean {
  return daysRemaining === targetDay;
}

/** محاسبه تاریخ پایان اشتراک بر اساس دوره (ماه) */
export function calculateSubscriptionExpiry(startDate: Date, periodMonths: number): Date {
  const expiry = new Date(startDate);
  expiry.setMonth(expiry.getMonth() + periodMonths);
  return expiry;
}

/** قیمت سالانه از ماهانه با تخفیف (درصد) */
export function annualPriceFromMonthly(monthlyPrice: number, discountPercent = 15): number {
  const yearly = monthlyPrice * 12;
  return Math.round(yearly * (1 - discountPercent / 100));
}
