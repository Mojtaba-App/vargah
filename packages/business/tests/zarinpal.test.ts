import { afterEach, describe, expect, it, vi } from 'vitest';
import { zarinpalTestConnection } from '@vargah/business/zarinpal';

describe('zarinpalTestConnection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('throws when merchant id is empty', async () => {
    await expect(
      zarinpalTestConnection({ merchantId: '', sandbox: true, callbackUrl: 'http://localhost:3000/cb' }),
    ).rejects.toThrow('Merchant ID');
  });

  it('returns success message when API accepts merchant', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: { code: 100, authority: 'A000', fee: 0, fee_type: 'Merchant' },
        }),
      }),
    );

    const message = await zarinpalTestConnection({
      merchantId: '00000000-0000-0000-0000-000000000000',
      sandbox: true,
      callbackUrl: 'http://localhost:3000/api/payments/callback',
    });

    expect(message).toContain('زرین‌پال');
    expect(message).toContain('Sandbox');
  });

  it('propagates API errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ errors: { message: 'Merchant invalid' } }),
      }),
    );

    await expect(
      zarinpalTestConnection({
        merchantId: 'bad-id',
        sandbox: true,
        callbackUrl: 'http://localhost:3000/cb',
      }),
    ).rejects.toThrow('Merchant invalid');
  });
});
