import { prisma } from '@vargah/database';
import {
  DEFAULT_SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLANS_KEY,
  getActiveSubscriptionPlans,
  mergeSubscriptionPlans,
  type SubscriptionPlanConfig,
} from '@vargah/business/subscription-plans';

/** بدون cache — پلن‌ها بلافاصله بعد از ذخیره در پنل روی سایت نمایش داده می‌شوند */
export async function getSubscriptionPlans(): Promise<SubscriptionPlanConfig[]> {
  try {
    const row = await prisma.siteSetting.findUnique({ where: { key: SUBSCRIPTION_PLANS_KEY } });
    const merged = row?.value ? mergeSubscriptionPlans(row.value) : DEFAULT_SUBSCRIPTION_PLANS;
    return getActiveSubscriptionPlans(merged);
  } catch (error) {
    console.error('[subscription-plans] Falling back to defaults:', error);
    return getActiveSubscriptionPlans(DEFAULT_SUBSCRIPTION_PLANS);
  }
}
