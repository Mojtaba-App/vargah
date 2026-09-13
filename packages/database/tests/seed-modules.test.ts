import { describe, expect, it } from 'vitest';
import { parseSeedModules, shouldRun } from '../prisma/seeds/types';

describe('seed modules', () => {
  it('defaults to all modules', () => {
    expect(parseSeedModules([])).toBe('all');
  });

  it('parses --only flag', () => {
    expect(parseSeedModules(['--only=users,content'])).toEqual(['users', 'content']);
  });

  it('rejects unknown modules', () => {
    expect(() => parseSeedModules(['--only=users,unknown'])).toThrow('نامعتبر');
  });

  it('shouldRun respects selection', () => {
    expect(shouldRun('all', 'users')).toBe(true);
    expect(shouldRun(['users'], 'content')).toBe(false);
    expect(shouldRun(['users'], 'users')).toBe(true);
  });
});
