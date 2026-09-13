import type { NpsSegment } from './nps';

export type NpsSegmentFilter = NpsSegment | 'ALL';

export const NPS_SCORE_LABELS: Record<number, string> = {
  0: 'بسیار نامحتمل',
  1: 'بسیار نامحتمل',
  2: 'نامحتمل',
  3: 'نامحتمل',
  4: 'نامحتمل',
  5: 'خنثی',
  6: 'خنثی',
  7: 'محتمل',
  8: 'محتمل',
  9: 'بسیار محتمل',
  10: 'بسیار محتمل',
};

export function getScoreBadgeTone(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}
