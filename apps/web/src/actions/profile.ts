'use server';

import { revalidatePath } from 'next/cache';
import {
  PaymentStatus,
  PaymentType,
  prisma,
  TicketCustomerType,
  TicketPriority,
  TicketStatus,
} from '@vargah/database';
import { customerAddressSchema } from '@vargah/security/schemas';
import { subscriberCityUpdate } from '@vargah/business/subscriber-location';
import { sanitizePlainText } from '@vargah/security/sanitize';
import { z } from 'zod';
import { getActiveSubscriptionPlans } from '@vargah/business/subscription-plans';

import { requireCustomerSession } from '@/actions/customer-auth';
import type { SubscriberDashboard } from '@/actions/subscription';
import { rateLimitOrThrow } from '@/lib/rate-limit';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { getSubscriptionPlans } from '@/lib/subscription-plans';

const PROFILE_LIMIT = 10;
const PROFILE_WINDOW_MS = 15 * 60 * 1000;
const TICKET_LIMIT = 5;
const TICKET_WINDOW_MS = 60 * 60 * 1000;

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
});

const ticketCreateSchema = z.object({
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(5000),
});

export type CustomerTicket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  resolvedAt: Date | string | null;
  replyCount: number;
};

export type CustomerProfile = SubscriberDashboard & {
  avatar: string | null;
  tickets: CustomerTicket[];
};

async function loadSubscriberDashboard(subscriberId: string): Promise<SubscriberDashboard | null> {
  const [subscriber, plansRaw] = await Promise.all([
    prisma.subscriber.findUnique({
      where: { id: subscriberId },
      include: {
        payments: {
          where: { type: PaymentType.SUBSCRIPTION },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    }),
    getSubscriptionPlans(),
  ]);

  if (!subscriber) return null;

  const plans = getActiveSubscriptionPlans(plansRaw.length ? plansRaw : []);
  const planName = plans.find((p) => p.slug === subscriber.planType)?.name ?? subscriber.planType;

  return {
    id: subscriber.id,
    name: subscriber.name,
    email: subscriber.email,
    phone: subscriber.phone,
    deliveryPhone: subscriber.deliveryPhone,
    province: subscriber.province,
    city: subscriber.city,
    address: subscriber.address,
    status: subscriber.status,
    planType: subscriber.planType,
    planName,
    expiresAt: subscriber.expiresAt,
    payments: subscriber.payments.map((payment) => ({
      id: payment.id,
      date: payment.paidAt ?? payment.createdAt,
      amount: Number(payment.amount),
      plan: payment.description?.replace(/^SUBSCRIPTION:[^—]+ — /, '') ?? planName ?? '—',
      status:
        payment.status === PaymentStatus.PAID
          ? 'paid'
          : payment.status === PaymentStatus.PENDING
            ? 'pending'
            : 'failed',
    })),
  };
}

export async function getCustomerProfile(): Promise<CustomerProfile | null> {
  const session = await requireCustomerSession().catch(() => null);
  if (!session) return null;

  const [dashboard, tickets, user] = await Promise.all([
    loadSubscriberDashboard(session.subscriberId),
    prisma.ticket.findMany({
      where: { subscriberId: session.subscriberId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        _count: { select: { replies: { where: { isInternal: false } } } },
      },
    }),
    prisma.user.findUnique({
      where: { phone: session.phone },
      select: { avatar: true },
    }),
  ]);

  if (!dashboard) return null;

  return {
    ...dashboard,
    avatar: user?.avatar ?? null,
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      body: ticket.body,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt,
      resolvedAt: ticket.resolvedAt,
      replyCount: ticket._count.replies,
    })),
  };
}

export async function updateCustomerProfile(input: { name: string; email: string }) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsed = profileUpdateSchema.parse(input);

  await rateLimitOrThrow(`profile:${session.subscriberId}`, PROFILE_LIMIT, PROFILE_WINDOW_MS);

  const email = parsed.email.toLowerCase();
  const existing = await prisma.subscriber.findUnique({ where: { email } });
  if (existing && existing.id !== session.subscriberId) {
    throw new Error('این ایمیل قبلاً برای حساب دیگری ثبت شده است.');
  }

  await prisma.subscriber.update({
    where: { id: session.subscriberId },
    data: {
      name: sanitizePlainText(parsed.name),
      email,
    },
  });

  if (session.phone) {
    await prisma.user.updateMany({
      where: { phone: session.phone },
      data: { name: sanitizePlainText(parsed.name), email },
    });
  }

  revalidatePath('/profile');
  return { success: true as const };
}

export async function updateCustomerAddress(input: {
  name: string;
  deliveryPhone: string;
  province: string;
  city: string;
  address: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsed = customerAddressSchema.parse(input);

  await rateLimitOrThrow(`address:${session.subscriberId}`, PROFILE_LIMIT, PROFILE_WINDOW_MS);

  await prisma.subscriber.update({
    where: { id: session.subscriberId },
    data: {
      name: sanitizePlainText(parsed.name),
      deliveryPhone: sanitizePlainText(parsed.deliveryPhone),
      address: sanitizePlainText(parsed.address),
      ...subscriberCityUpdate(sanitizePlainText(parsed.province), sanitizePlainText(parsed.city)),
    },
  });

  revalidatePath('/profile');
  return { success: true as const };
}

export async function createCustomerTicket(input: { subject: string; body: string }) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsed = ticketCreateSchema.parse(input);

  await rateLimitOrThrow(`ticket:${session.subscriberId}`, TICKET_LIMIT, TICKET_WINDOW_MS);

  const subscriber = await prisma.subscriber.findUnique({
    where: { id: session.subscriberId },
  });
  if (!subscriber) throw new Error('حساب کاربری یافت نشد.');

  const ticket = await prisma.ticket.create({
    data: {
      subject: sanitizePlainText(parsed.subject),
      body: sanitizePlainText(parsed.body),
      customerType: TicketCustomerType.SUBSCRIBER,
      customerName: sanitizePlainText(subscriber.name),
      customerEmail: subscriber.email,
      customerPhone: subscriber.phone,
      subscriberId: subscriber.id,
      priority: TicketPriority.NORMAL,
      status: TicketStatus.OPEN,
    },
  });

  revalidatePath('/profile');
  return { id: ticket.id };
}
