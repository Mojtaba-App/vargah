import { describe, expect, it } from 'vitest';
import {
  hasAdminSmsVerification,
  isValidIranPhone,
  isValidUsername,
  maskPhone,
  normalizeAdminLoginIdentifier,
  normalizeIranPhone,
} from '@vargah/security/phone';

describe('normalizeIranPhone', () => {
  it('accepts 09xxxxxxxxx', () => {
    expect(normalizeIranPhone('09123456789')).toBe('09123456789');
  });

  it('normalizes +98 prefix', () => {
    expect(normalizeIranPhone('+989123456789')).toBe('09123456789');
  });

  it('rejects invalid numbers', () => {
    expect(() => normalizeIranPhone('123')).toThrow();
  });
});

describe('maskPhone', () => {
  it('masks middle digits', () => {
    expect(maskPhone('09123456789')).toBe('0912***789');
  });
});

describe('hasAdminSmsVerification', () => {
  it('is true when phone is set', () => {
    expect(hasAdminSmsVerification('09120000001')).toBe(true);
  });

  it('is false for empty phone', () => {
    expect(hasAdminSmsVerification(null)).toBe(false);
    expect(hasAdminSmsVerification('  ')).toBe(false);
  });
});

describe('normalizeAdminLoginIdentifier', () => {
  it('detects email', () => {
    expect(normalizeAdminLoginIdentifier('Admin@Magazine.ir')).toEqual({
      kind: 'email',
      value: 'admin@magazine.ir',
    });
  });

  it('detects username', () => {
    expect(normalizeAdminLoginIdentifier('Writer')).toEqual({
      kind: 'username',
      value: 'writer',
    });
  });
});

describe('validators', () => {
  it('validates username pattern', () => {
    expect(isValidUsername('editor.vargah')).toBe(true);
    expect(isValidUsername('ab')).toBe(false);
  });

  it('validates iran phone', () => {
    expect(isValidIranPhone('09121234567')).toBe(true);
    expect(isValidIranPhone('invalid')).toBe(false);
  });
});
