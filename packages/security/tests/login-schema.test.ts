import { describe, expect, it } from 'vitest';
import { loginSchema } from '@vargah/security/schemas';

describe('loginSchema', () => {
  it('accepts email + password step', () => {
    const result = loginSchema.safeParse({
      identifier: 'admin@magazine.ir',
      password: 'admin1234',
    });
    expect(result.success).toBe(true);
  });

  it('accepts username + password step', () => {
    const result = loginSchema.safeParse({
      identifier: 'admin',
      password: 'admin1234',
    });
    expect(result.success).toBe(true);
  });

  it('accepts sms otp step', () => {
    const result = loginSchema.safeParse({
      identifier: 'admin',
      password: 'admin1234',
      smsCode: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty identifier on password step', () => {
    const result = loginSchema.safeParse({ identifier: '', password: 'x' });
    expect(result.success).toBe(false);
  });
});
