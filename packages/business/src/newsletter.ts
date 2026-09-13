import { randomBytes } from 'node:crypto';

import { NewsletterStatus, prisma } from '@vargah/database';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function newToken() {
  return randomBytes(24).toString('base64url');
}

export type NewsletterConsentMeta = {
  consentIp?: string | null;
  userAgent?: string | null;
  source?: string;
};

export type NewsletterSubscribeResult = {
  ok: true;
  alreadySubscribed: boolean;
  reactivated: boolean;
};

/** عضویت تک‌مرحله‌ای با توکن لغو */
export async function subscribeToNewsletter(
  email: string,
  meta: NewsletterConsentMeta = {},
): Promise<NewsletterSubscribeResult> {
  const normalized = normalizeEmail(email);
  const source = meta.source ?? 'website';
  const existing = await prisma.newsletterSubscription.findUnique({
    where: { email: normalized },
  });

  if (existing?.status === NewsletterStatus.ACTIVE) {
    return { ok: true, alreadySubscribed: true, reactivated: false };
  }

  if (existing) {
    await prisma.newsletterSubscription.update({
      where: { id: existing.id },
      data: {
        status: NewsletterStatus.ACTIVE,
        confirmedAt: existing.confirmedAt ?? new Date(),
        unsubscribedAt: null,
        unsubscribeToken: existing.unsubscribeToken || newToken(),
        source,
        consentIp: meta.consentIp ?? existing.consentIp,
        userAgent: meta.userAgent ?? existing.userAgent,
      },
    });
    return { ok: true, alreadySubscribed: false, reactivated: true };
  }

  await prisma.newsletterSubscription.create({
    data: {
      email: normalized,
      status: NewsletterStatus.ACTIVE,
      confirmedAt: new Date(),
      unsubscribeToken: newToken(),
      source,
      consentIp: meta.consentIp ?? null,
      userAgent: meta.userAgent ?? null,
    },
  });

  return { ok: true, alreadySubscribed: false, reactivated: false };
}

export async function unsubscribeFromNewsletter(token: string) {
  const row = await prisma.newsletterSubscription.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!row) return { ok: false as const, reason: 'not_found' as const };
  if (row.status === NewsletterStatus.UNSUBSCRIBED) {
    return { ok: true as const, already: true as const, email: row.email };
  }

  await prisma.newsletterSubscription.update({
    where: { id: row.id },
    data: {
      status: NewsletterStatus.UNSUBSCRIBED,
      unsubscribedAt: new Date(),
    },
  });

  return { ok: true as const, already: false as const, email: row.email };
}

export async function listActiveNewsletterEmails(take = 5000) {
  return prisma.newsletterSubscription.findMany({
    where: { status: NewsletterStatus.ACTIVE },
    select: { id: true, email: true, createdAt: true, source: true },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
