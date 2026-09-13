import { describe, expect, it } from 'vitest';
import { CommissionStatus } from '@prisma/client';
import { canTransition } from '../src/workflow';

describe('commission workflow', () => {
  it('allows valid forward transitions', () => {
    expect(canTransition(CommissionStatus.TOPIC_DEFINED, CommissionStatus.ASSIGNED)).toBe(true);
    expect(canTransition(CommissionStatus.IN_REVIEW, CommissionStatus.APPROVED)).toBe(true);
    expect(canTransition(CommissionStatus.IN_REVIEW, CommissionStatus.REJECTED)).toBe(true);
  });

  it('allows rejected to return to writing', () => {
    expect(canTransition(CommissionStatus.REJECTED, CommissionStatus.IN_WRITING)).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(canTransition(CommissionStatus.TOPIC_DEFINED, CommissionStatus.APPROVED)).toBe(false);
    expect(canTransition(CommissionStatus.APPROVED, CommissionStatus.IN_WRITING)).toBe(false);
  });
});
