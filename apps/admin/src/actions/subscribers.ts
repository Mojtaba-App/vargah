'use server';

import { revalidatePath } from 'next/cache';
import {
  prisma,
  AuditAction,
  SubscriptionStatus,
  PaymentStatus,
  PaymentType,
} from '@vargah/database';

import { recordAuditLog } from '@/lib/audit/record';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { subscriberFormSchema } from '@/lib/schemas/subscriber-form';
import { verifyCsrfFromRequest } from '@/lib/security/request';

function parseSubscriberForm(formData: FormData) {
  return subscriberFormSchema.parse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
    province: formData.get('province') || '',
    city: formData.get('city') || '',
    address: formData.get('address') || '',
    status: formData.get('status') || SubscriptionStatus.PENDING_PAYMENT,
    planType: formData.get('planType') || '',
    expiresAt: formData.get('expiresAt') || '',
  });
}

function resolveExpiresAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createSubscriber(formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SUBSCRIBER_MANAGE);
  const parsed = parseSubscriberForm(formData);

  const existing = await prisma.subscriber.findUnique({ where: { email: parsed.email } });
  if (existing) throw new Error('این ایمیل قبلاً ثبت شده است');

  const subscriber = await prisma.subscriber.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      province: parsed.province || null,
      city: parsed.city || null,
      address: parsed.address || null,
      status: parsed.status,
      planType: parsed.planType || null,
      expiresAt: resolveExpiresAt(parsed.expiresAt),
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.CREATE,
    entity: 'Subscriber',
    entityId: subscriber.id,
    changes: { name: parsed.name, email: parsed.email, status: parsed.status },
  });

  revalidatePath('/crm/subscribers');
}

export async function updateSubscriber(id: string, formData: FormData) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SUBSCRIBER_MANAGE);
  const parsed = parseSubscriberForm(formData);

  const existing = await prisma.subscriber.findUnique({ where: { id } });
  if (!existing) throw new Error('مشترک یافت نشد');

  if (parsed.email !== existing.email) {
    const emailOwner = await prisma.subscriber.findUnique({ where: { email: parsed.email } });
    if (emailOwner && emailOwner.id !== id) throw new Error('این ایمیل قبلاً ثبت شده است');
  }

  await prisma.subscriber.update({
    where: { id },
    data: {
      name: parsed.name,
      email: parsed.email,
      phone: parsed.phone,
      province: parsed.province || null,
      city: parsed.city || null,
      address: parsed.address || null,
      status: parsed.status,
      planType: parsed.planType || null,
      expiresAt: resolveExpiresAt(parsed.expiresAt),
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Subscriber',
    entityId: id,
    changes: { status: parsed.status, planType: parsed.planType },
  });

  revalidatePath('/crm/subscribers');
}

export async function deleteSubscriber(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SUBSCRIBER_MANAGE);

  const subscriber = await prisma.subscriber.findUnique({
    where: { id },
    include: { _count: { select: { payments: true, tickets: true } } },
  });
  if (!subscriber) throw new Error('مشترک یافت نشد');

  if (subscriber._count.payments > 0 || subscriber._count.tickets > 0) {
    throw new Error('مشترک دارای پرداخت یا تیکت است و قابل حذف نیست');
  }

  await prisma.subscriber.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'Subscriber',
    entityId: id,
    changes: { email: subscriber.email },
  });

  revalidatePath('/crm/subscribers');
}

export async function activateSubscriber(id: string, amount?: number) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SUBSCRIBER_MANAGE);

  const subscriber = await prisma.subscriber.findUnique({ where: { id } });
  if (!subscriber) throw new Error('مشترک یافت نشد');

  const expiresAt =
    subscriber.expiresAt && subscriber.expiresAt > new Date()
      ? subscriber.expiresAt
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.subscriber.update({
      where: { id },
      data: { status: SubscriptionStatus.ACTIVE, expiresAt },
    });

    if (amount && amount > 0) {
      await tx.payment.create({
        data: {
          amount,
          type: PaymentType.SUBSCRIPTION,
          status: PaymentStatus.PAID,
          subscriberId: id,
          description: 'فعال‌سازی اشتراک',
          paidAt: new Date(),
          gateway: 'manual',
        },
      });
    }
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Subscriber',
    entityId: id,
    changes: { status: SubscriptionStatus.ACTIVE, expiresAt: expiresAt.toISOString() },
  });

  revalidatePath('/crm/subscribers');
}

export async function extendSubscriber(id: string, days = 365) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SUBSCRIBER_MANAGE);

  const subscriber = await prisma.subscriber.findUnique({ where: { id } });
  if (!subscriber) throw new Error('مشترک یافت نشد');

  const base =
    subscriber.expiresAt && subscriber.expiresAt > new Date() ? subscriber.expiresAt : new Date();
  const expiresAt = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

  await prisma.subscriber.update({
    where: { id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      expiresAt,
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Subscriber',
    entityId: id,
    changes: { action: 'extend', days, expiresAt: expiresAt.toISOString() },
  });

  revalidatePath('/crm/subscribers');
}

export async function cancelSubscriber(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SUBSCRIBER_MANAGE);

  const subscriber = await prisma.subscriber.findUnique({ where: { id } });
  if (!subscriber) throw new Error('مشترک یافت نشد');

  await prisma.subscriber.update({
    where: { id },
    data: { status: SubscriptionStatus.CANCELLED },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'Subscriber',
    entityId: id,
    changes: { status: SubscriptionStatus.CANCELLED },
  });

  revalidatePath('/crm/subscribers');
}
