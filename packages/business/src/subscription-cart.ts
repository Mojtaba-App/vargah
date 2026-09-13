import type { SubscriptionPlanConfig, SubscriptionPlanType } from './subscription-plans';
import { findSubscriptionPlan, planRequiresAddress } from './subscription-plans';
import { getPlanSalePrice } from './discounts';

export const SUBSCRIPTION_CART_MAX_QTY = 12;
export const SUBSCRIPTION_CART_MAX_LINES = 8;
/** نگهداری سبد رهاشده: ۲ هفته — بازه رایج بازیابی سبد در فروش آنلاین */
export const SUBSCRIPTION_CART_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const SUBSCRIPTION_CART_TTL_DAYS = 14;

export type SubscriptionCartLineInput = {
  planSlug: string;
  quantity: number;
};

export type ResolvedSubscriptionCartLine = {
  plan: SubscriptionPlanConfig;
  quantity: number;
  /** قیمت واحد پس از تخفیف محصول */
  unitPrice: number;
  /** قیمت لیست قبل از تخفیف محصول */
  listUnitPrice: number;
  lineTotal: number;
  periodMonthsTotal: number;
};

export function clampSubscriptionQuantity(quantity: number): number {
  const n = Math.floor(Number(quantity) || 1);
  return Math.min(SUBSCRIPTION_CART_MAX_QTY, Math.max(1, n));
}

export function resolveSubscriptionCartLines(
  plans: SubscriptionPlanConfig[],
  items: SubscriptionCartLineInput[],
): ResolvedSubscriptionCartLine[] {
  const merged = new Map<string, number>();
  for (const item of items) {
    const slug = item.planSlug?.trim();
    if (!slug) continue;
    const qty = clampSubscriptionQuantity(item.quantity);
    merged.set(slug, clampSubscriptionQuantity((merged.get(slug) ?? 0) + qty));
  }

  const lines: ResolvedSubscriptionCartLine[] = [];
  for (const [slug, quantity] of merged) {
    const plan = findSubscriptionPlan(plans, slug);
    if (!plan) continue;
    const listUnitPrice = Math.max(0, Math.floor(plan.price));
    const unitPrice = getPlanSalePrice(plan);
    lines.push({
      plan,
      quantity,
      unitPrice,
      listUnitPrice,
      lineTotal: unitPrice * quantity,
      periodMonthsTotal: plan.periodMonths * quantity,
    });
  }
  return lines.slice(0, SUBSCRIPTION_CART_MAX_LINES);
}

export function sumSubscriptionCartTotals(lines: ResolvedSubscriptionCartLine[]) {
  return {
    amount: lines.reduce((sum, line) => sum + line.lineTotal, 0),
    listAmount: lines.reduce((sum, line) => sum + line.listUnitPrice * line.quantity, 0),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    periodMonths: lines.reduce((sum, line) => sum + line.periodMonthsTotal, 0),
  };
}

/** اولویت پلن اصلی برای وضعیت مشترک: ترکیبی > چاپی > دیجیتال */
export function pickPrimarySubscriptionPlan(
  lines: ResolvedSubscriptionCartLine[],
): SubscriptionPlanConfig | null {
  if (lines.length === 0) return null;
  const rank: Record<SubscriptionPlanType, number> = { combo: 3, print: 2, digital: 1 };
  return [...lines].sort((a, b) => {
    const typeDiff = rank[b.plan.type] - rank[a.plan.type];
    if (typeDiff !== 0) return typeDiff;
    return b.lineTotal - a.lineTotal;
  })[0]!.plan;
}

export function cartRequiresAddress(lines: ResolvedSubscriptionCartLine[]): boolean {
  return lines.some((line) => planRequiresAddress(line.plan.type));
}

export function formatSubscriptionCartPaymentDescription(
  lines: ResolvedSubscriptionCartLine[],
): string {
  const encoded = lines.map((line) => `${line.plan.slug}*${line.quantity}`).join(',');
  const label = lines.map((line) => `${line.plan.name}×${line.quantity}`).join('، ');
  return `SUBSCRIPTION:${encoded} — ${label}`;
}

export function parseSubscriptionCartLines(
  description: string | null | undefined,
): SubscriptionCartLineInput[] {
  if (!description) return [];
  const match = description.match(/^SUBSCRIPTION:([^—]+)/);
  if (!match?.[1]) return [];
  const raw = match[1].trim();

  if (!raw.includes('*') && !raw.includes(',')) {
    return [{ planSlug: raw, quantity: 1 }];
  }

  return raw
    .split(',')
    .map((part) => {
      const [slug, qtyRaw] = part.trim().split('*');
      if (!slug?.trim()) return null;
      return {
        planSlug: slug.trim(),
        quantity: clampSubscriptionQuantity(Number(qtyRaw) || 1),
      };
    })
    .filter((item): item is SubscriptionCartLineInput => Boolean(item));
}
