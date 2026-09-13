import { describe, expect, it } from 'vitest';
import { humanizePaymentError } from '@vargah/business/payment-errors';

describe('humanizePaymentError', () => {
  it('translates merchant id length error', () => {
    expect(humanizePaymentError('The merchant id must not be greater than 36 characters.')).toBe(
      'شناسه پذیرنده (Merchant ID) نباید بیشتر از ۳۶ کاراکتر باشد.',
    );
  });

  it('passes through unknown persian messages', () => {
    expect(humanizePaymentError('خطای سفارشی')).toBe('خطای سفارشی');
  });
});
