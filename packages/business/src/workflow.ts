import { CommissionStatus } from '@vargah/database';

export const COMMISSION_TRANSITIONS: Record<CommissionStatus, CommissionStatus[]> = {
  [CommissionStatus.TOPIC_DEFINED]: [CommissionStatus.ASSIGNED],
  [CommissionStatus.ASSIGNED]: [CommissionStatus.IN_WRITING],
  [CommissionStatus.IN_WRITING]: [CommissionStatus.SUBMITTED],
  [CommissionStatus.SUBMITTED]: [CommissionStatus.IN_REVIEW],
  [CommissionStatus.IN_REVIEW]: [CommissionStatus.APPROVED, CommissionStatus.REJECTED],
  [CommissionStatus.REJECTED]: [CommissionStatus.IN_WRITING],
  [CommissionStatus.APPROVED]: [],
};

export function canTransition(from: CommissionStatus, to: CommissionStatus): boolean {
  return COMMISSION_TRANSITIONS[from]?.includes(to) ?? false;
}
