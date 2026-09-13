import { describe, expect, it } from 'vitest';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { calculateMonthlyRevenue } from '../src/finance';

describe('calculateMonthlyRevenue', () => {
  const ref = new Date('2026-08-15');

  it('sums subscription and ad revenue for current month', () => {
    const result = calculateMonthlyRevenue(
      [
        {
          status: PaymentStatus.PAID,
          type: PaymentType.SUBSCRIPTION,
          amount: 990_000,
          paidAt: new Date('2026-08-10'),
        },
        {
          status: PaymentStatus.PAID,
          type: PaymentType.ADVERTISEMENT,
          amount: 5_000_000,
          paidAt: new Date('2026-08-12'),
        },
        {
          status: PaymentStatus.PAID,
          type: PaymentType.SUBSCRIPTION,
          amount: 99_000,
          paidAt: new Date('2026-07-20'),
        },
        {
          status: PaymentStatus.PENDING,
          type: PaymentType.SUBSCRIPTION,
          amount: 990_000,
          paidAt: new Date('2026-08-11'),
        },
      ],
      ref,
    );

    expect(result.subscription).toBe(990_000);
    expect(result.advertisement).toBe(5_000_000);
    expect(result.total).toBe(5_990_000);
  });

  it('returns zero when no paid payments in month', () => {
    const result = calculateMonthlyRevenue([], ref);
    expect(result).toEqual({ subscription: 0, advertisement: 0, total: 0 });
  });
});
