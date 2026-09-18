export type NpsSegment = 'promoter' | 'passive' | 'detractor';

export type NpsDistributionItem = {
  score: number;
  count: number;
  pct: number;
};

export type NpsMetrics = {
  total: number;
  average: number | null;
  npsScore: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  promoterPct: number;
  passivePct: number;
  detractorPct: number;
  distribution: NpsDistributionItem[];
};

export function classifyNpsScore(score: number): NpsSegment {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

export const NPS_SEGMENT_LABELS: Record<NpsSegment, string> = {
  promoter: 'مروج',
  passive: 'خنثی',
  detractor: 'منتقد',
};

export function computeNpsMetrics(scores: number[]): NpsMetrics {
  const distribution = Array.from({ length: 11 }, (_, score) => ({
    score,
    count: 0,
    pct: 0,
  }));

  if (scores.length === 0) {
    return {
      total: 0,
      average: null,
      npsScore: null,
      promoters: 0,
      passives: 0,
      detractors: 0,
      promoterPct: 0,
      passivePct: 0,
      detractorPct: 0,
      distribution,
    };
  }

  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let sum = 0;

  for (const score of scores) {
    sum += score;
    distribution[score]!.count += 1;
    const segment = classifyNpsScore(score);
    if (segment === 'promoter') promoters += 1;
    else if (segment === 'passive') passives += 1;
    else detractors += 1;
  }

  const total = scores.length;
  const promoterPct = (promoters / total) * 100;
  const passivePct = (passives / total) * 100;
  const detractorPct = (detractors / total) * 100;

  return {
    total,
    average: sum / total,
    npsScore: Math.round(promoterPct - detractorPct),
    promoters,
    passives,
    detractors,
    promoterPct,
    passivePct,
    detractorPct,
    distribution: distribution.map((item) => ({
      ...item,
      pct: (item.count / total) * 100,
    })),
  };
}

export function formatNpsScore(score: number | null): string {
  if (score === null) return '—';
  return score > 0 ? `+${score}` : String(score);
}

export function getNpsScoreTone(
  score: number | null,
): 'excellent' | 'good' | 'fair' | 'poor' | 'empty' {
  if (score === null) return 'empty';
  if (score >= 50) return 'excellent';
  if (score >= 0) return 'good';
  if (score >= -30) return 'fair';
  return 'poor';
}
