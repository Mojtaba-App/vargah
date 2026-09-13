import { describe, expect, it } from 'vitest';
import {
  annualPriceFromMonthly,
  calculateSubscriptionExpiry,
  daysUntil,
  shouldSendExpiryReminder,
} from '../src/subscription';

describe('subscription helpers', () => {
  it('calculates days until expiry', () => {
    const now = new Date('2026-08-01T12:00:00');
    const expiry = new Date('2026-08-08T12:00:00');
    expect(daysUntil(expiry, now)).toBe(7);
  });

  it('triggers reminder only on target days', () => {
    expect(shouldSendExpiryReminder(7, 7)).toBe(true);
    expect(shouldSendExpiryReminder(6, 7)).toBe(false);
    expect(shouldSendExpiryReminder(1, 1)).toBe(true);
  });

  it('calculates subscription expiry from start date', () => {
    const start = new Date('2026-01-15');
    const expiry = calculateSubscriptionExpiry(start, 12);
    expect(expiry.getFullYear()).toBe(2027);
    expect(expiry.getMonth()).toBe(0);
  });

  it('applies annual discount to monthly price', () => {
    expect(annualPriceFromMonthly(99_000, 15)).toBe(1_009_800);
  });
});
