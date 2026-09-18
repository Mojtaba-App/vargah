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
import { getActiveSubscriptionPlans } from '@vargah/business/subscription-plans';

import { requireCustomerSession } from '@/actions/customer-auth';
import type { SubscriberDashboard } from '@/actions/subscription';
import { rateLimitOrThrow } from '@/lib/rate-limit';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import {
  profileUpdateSchema,
  ticketCreateSchema,
  ticketReplySchema,
} from '@/lib/profile/form-schemas';
import { getSubscriptionPlans } from '@/lib/subscription-plans';

const PROFILE_LIMIT = 10;
const PROFILE_WINDOW_MS = 15 * 60 * 1000;
const TICKET_LIMIT = 5;
const TICKET_WINDOW_MS = 60 * 60 * 1000;

function firstSchemaMessage(error: { issues: { message: string }[] }, fallback: string) {
  return error.issues[0]?.message ?? fallback;
}

export type CustomerTicket = {
  id: string;
  subject: string;
  body: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  resolvedAt: Date | string | null;
  replyCount: number;
  replies: CustomerTicketReply[];
};

export type CustomerTicketReply = {
  id: string;
  body: string;
  createdAt: Date | string;
  fromSupport: boolean;
  authorName: string | null;
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
    postalCode: subscriber.postalCode,
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
        replies: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { name: true } } },
        },
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
      replyCount: ticket.replies.length,
      replies: ticket.replies.map((reply) => ({
        id: reply.id,
        body: reply.body,
        createdAt: reply.createdAt,
        fromSupport: Boolean(reply.authorId),
        authorName: reply.author?.name ?? null,
      })),
    })),
  };
}

export async function updateCustomerProfile(input: { name: string; email: string }) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsedResult = profileUpdateSchema.safeParse(input);
  if (!parsedResult.success) {
    throw new Error(firstSchemaMessage(parsedResult.error, 'اطلاعات حساب را بررسی کنید.'));
  }
  const parsed = parsedResult.data;

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
  postalCode: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsedResult = customerAddressSchema.safeParse(input);
  if (!parsedResult.success) {
    throw new Error(firstSchemaMessage(parsedResult.error, 'آدرس را بررسی کنید.'));
  }
  const parsed = parsedResult.data;

  await rateLimitOrThrow(`address:${session.subscriberId}`, PROFILE_LIMIT, PROFILE_WINDOW_MS);

  await prisma.subscriber.update({
    where: { id: session.subscriberId },
    data: {
      name: sanitizePlainText(parsed.name),
      deliveryPhone: sanitizePlainText(parsed.deliveryPhone),
      address: sanitizePlainText(parsed.address),
      postalCode: parsed.postalCode,
      ...subscriberCityUpdate(sanitizePlainText(parsed.province), sanitizePlainText(parsed.city)),
    },
  });

  revalidatePath('/profile');
  return { success: true as const };
}

export async function createCustomerTicket(input: {
  subject: string;
  body: string;
  priority: string;
}) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsedResult = ticketCreateSchema.safeParse(input);
  if (!parsedResult.success) {
    throw new Error(firstSchemaMessage(parsedResult.error, 'موضوع و پیام تیکت را بررسی کنید.'));
  }
  const parsed = parsedResult.data;

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
      priority: parsed.priority as TicketPriority,
      status: TicketStatus.OPEN,
    },
  });

  revalidatePath('/profile');
  return { id: ticket.id };
}

export async function replyToCustomerTicket(input: { ticketId: string; body: string }) {
  await verifyCsrfFromRequest();
  const session = await requireCustomerSession();
  const parsedResult = ticketReplySchema.safeParse(input);
  if (!parsedResult.success) {
    throw new Error(firstSchemaMessage(parsedResult.error, 'متن پاسخ را بررسی کنید.'));
  }
  const parsed = parsedResult.data;

  await rateLimitOrThrow(`ticket-reply:${session.subscriberId}`, TICKET_LIMIT, TICKET_WINDOW_MS);

  const ticket = await prisma.ticket.findFirst({
    where: { id: parsed.ticketId, subscriberId: session.subscriberId },
  });
  if (!ticket) throw new Error('تیکت یافت نشد.');
  if (ticket.status === TicketStatus.CLOSED || ticket.status === TicketStatus.RESOLVED) {
    throw new Error('این تیکت بسته شده و دیگر پاسخی نمی‌پذیرد.');
  }
  if (ticket.status !== TicketStatus.WAITING_CUSTOMER) {
    throw new Error('تا وقتی پشتیبانی پاسخ نداده، ارسال پیام بعدی ممکن نیست.');
  }

  const lastPublicReply = await prisma.ticketReply.findFirst({
    where: { ticketId: ticket.id, isInternal: false },
    orderBy: { createdAt: 'desc' },
    select: { authorId: true },
  });
  if (!lastPublicReply?.authorId) {
    throw new Error('تا وقتی پشتیبانی پاسخ نداده، ارسال پیام بعدی ممکن نیست.');
  }

  await prisma.ticketReply.create({
    data: {
      ticketId: ticket.id,
      body: sanitizePlainText(parsed.body),
      isInternal: false,
    },
  });

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: TicketStatus.OPEN },
  });

  revalidatePath('/profile');
  return { success: true as const };
}
