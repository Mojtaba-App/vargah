import { prisma } from '@vargah/database';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLANS_KEY,
  mergeSubscriptionPlans,
  type SubscriptionPlanConfig,
} from '@vargah/business/subscription-plans';

export async function getSubscriptionPlansConfig(): Promise<SubscriptionPlanConfig[]> {
  const row = await prisma.siteSetting.findUnique({ where: { key: SUBSCRIPTION_PLANS_KEY } });
  if (!row?.value) return DEFAULT_SUBSCRIPTION_PLANS;
  return mergeSubscriptionPlans(row.value);
}

export async function saveSubscriptionPlansConfig(plans: SubscriptionPlanConfig[]) {
  await prisma.siteSetting.upsert({
    where: { key: SUBSCRIPTION_PLANS_KEY },
    create: { key: SUBSCRIPTION_PLANS_KEY, value: plans },
    update: { value: plans },
  });
}
