import {
  NotificationChannel,
  PaymentStatus,
  Prisma,
  SubscriptionStatus,
  type PrismaClient,
} from '@vargah/database';

export const CAMPAIGN_SEGMENTS = [
  'all',
  'active',
  'expired',
  'pending_payment',
  'cancelled',
  'with_paid_purchase',
  'never_purchased',
] as const;

export type CampaignSegment = (typeof CAMPAIGN_SEGMENTS)[number];

export type CampaignAudienceFilters = {
  segment?: CampaignSegment;
  registeredFrom?: string;
  registeredTo?: string;
  purchasedFrom?: string;
  purchasedTo?: string;
  planType?: string;
  province?: string;
  cityId?: string;
  search?: string;
};

export const CAMPAIGN_SEGMENT_LABELS: Record<CampaignSegment, string> = {
  all: 'همه مشترکین',
  active: 'اشتراک فعال',
  expired: 'اشتراک منقضی',
  pending_payment: 'در انتظار پرداخت',
  cancelled: 'لغو‌شده',
  with_paid_purchase: 'دارای خرید موفق',
  never_purchased: 'بدون خرید موفق',
};

function parseFlexibleDate(value?: string, fallbackEndOfDay = false): Date | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  // ISO کامل از فیلد جلالی، یا YYYY-MM-DD قدیمی
  if (trimmed.includes('T') || trimmed.endsWith('Z')) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(
      fallbackEndOfDay ? `${trimmed}T23:59:59.999Z` : `${trimmed}T00:00:00.000Z`,
    );
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseDayStart(value?: string): Date | undefined {
  return parseFlexibleDate(value, false);
}

function parseDayEnd(value?: string): Date | undefined {
  return parseFlexibleDate(value, true);
}

export function normalizeCampaignFilters(input: unknown): CampaignAudienceFilters {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const segment =
    typeof raw.segment === 'string' && (CAMPAIGN_SEGMENTS as readonly string[]).includes(raw.segment)
      ? (raw.segment as CampaignSegment)
      : 'all';

  const pick = (key: string) => {
    const value = raw[key];
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  };

  return {
    segment,
    registeredFrom: pick('registeredFrom'),
    registeredTo: pick('registeredTo'),
    purchasedFrom: pick('purchasedFrom'),
    purchasedTo: pick('purchasedTo'),
    planType: pick('planType'),
    province: pick('province'),
    cityId: pick('cityId'),
    search: pick('search'),
  };
}

export function buildAudienceWhere(
  channel: NotificationChannel,
  filters: CampaignAudienceFilters,
): Prisma.SubscriberWhereInput {
  const and: Prisma.SubscriberWhereInput[] = [];

  if (channel === NotificationChannel.EMAIL) {
    and.push({ email: { not: '' } });
  } else if (channel === NotificationChannel.SMS) {
    and.push({
      OR: [
        { phone: { not: null } },
        { deliveryPhone: { not: null } },
      ],
    });
  }

  switch (filters.segment ?? 'all') {
    case 'active':
      and.push({ status: SubscriptionStatus.ACTIVE });
      break;
    case 'expired':
      and.push({ status: SubscriptionStatus.EXPIRED });
      break;
    case 'pending_payment':
      and.push({ status: SubscriptionStatus.PENDING_PAYMENT });
      break;
    case 'cancelled':
      and.push({ status: SubscriptionStatus.CANCELLED });
      break;
    case 'with_paid_purchase':
      and.push({
        payments: {
          some: { status: PaymentStatus.PAID },
        },
      });
      break;
    case 'never_purchased':
      and.push({
        payments: {
          none: { status: PaymentStatus.PAID },
        },
      });
      break;
    default:
      break;
  }

  const registeredFrom = parseDayStart(filters.registeredFrom);
  const registeredTo = parseDayEnd(filters.registeredTo);
  if (registeredFrom || registeredTo) {
    and.push({
      createdAt: {
        ...(registeredFrom ? { gte: registeredFrom } : {}),
        ...(registeredTo ? { lte: registeredTo } : {}),
      },
    });
  }

  const purchasedFrom = parseDayStart(filters.purchasedFrom);
  const purchasedTo = parseDayEnd(filters.purchasedTo);
  if (purchasedFrom || purchasedTo) {
    and.push({
      payments: {
        some: {
          status: PaymentStatus.PAID,
          OR: [
            {
              paidAt: {
                ...(purchasedFrom ? { gte: purchasedFrom } : {}),
                ...(purchasedTo ? { lte: purchasedTo } : {}),
              },
            },
            {
              paidAt: null,
              createdAt: {
                ...(purchasedFrom ? { gte: purchasedFrom } : {}),
                ...(purchasedTo ? { lte: purchasedTo } : {}),
              },
            },
          ],
        },
      },
    });
  }

  if (filters.planType) {
    and.push({ planType: filters.planType });
  }
  if (filters.province) {
    and.push({ province: filters.province });
  }
  if (filters.cityId) {
    and.push({ cityId: filters.cityId });
  }
  if (filters.search) {
    and.push({
      OR: [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search } },
        { deliveryPhone: { contains: filters.search } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function resolveRecipientAddress(
  channel: NotificationChannel,
  subscriber: {
    email: string;
    phone: string | null;
    deliveryPhone: string | null;
  },
): string | null {
  if (channel === NotificationChannel.EMAIL) {
    const email = subscriber.email.trim();
    return email || null;
  }
  if (channel === NotificationChannel.SMS) {
    const phone = (subscriber.deliveryPhone || subscriber.phone || '').trim();
    return phone || null;
  }
  return null;
}

export async function countAudience(
  db: PrismaClient,
  channel: NotificationChannel,
  filters: CampaignAudienceFilters,
) {
  return db.subscriber.count({
    where: buildAudienceWhere(channel, filters),
  });
}

export async function listAudience(
  db: PrismaClient,
  channel: NotificationChannel,
  filters: CampaignAudienceFilters,
  take = 5000,
) {
  return db.subscriber.findMany({
    where: buildAudienceWhere(channel, filters),
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      deliveryPhone: true,
      status: true,
      planType: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
