'use server';

import { revalidatePath } from 'next/cache';
import { prisma, UserRole, SubscriptionStatus } from '@vargah/database';
import { z } from 'zod';

import { normalizeIranPhone } from '@/lib/customer-auth/phone';
import {
  clearCustomerSessionCookie,
  getCustomerSession,
  setCustomerSessionCookie,
  type CustomerSession,
} from '@/lib/customer-auth/session';
import { createPhoneOtp, verifyPhoneOtp } from '@/lib/otp-service';
import { getClientIp, verifyCsrfFromRequest } from '@/lib/security/request';

export type { CustomerSession };

const phoneSchema = z.object({
  phone: z.string().min(10).max(20),
});

const verifySchema = z.object({
  phone: z.string().min(10).max(20),
  code: z.string().length(6),
});

async function findOrCreateSubscriberByPhone(phone: string) {
  const existing = await prisma.subscriber.findFirst({ where: { phone } });
  if (existing) return existing;

  const email = `${phone.replace(/\D/g, '')}@phone.vargah.local`;
  const emailTaken = await prisma.subscriber.findUnique({ where: { email } });
  if (emailTaken) return emailTaken;

  return prisma.subscriber.create({
    data: {
      name: 'مشترک',
      email,
      phone,
      status: SubscriptionStatus.NONE,
    },
  });
}

async function syncCustomerUser(phone: string, name: string) {
  await prisma.user.upsert({
    where: { phone },
    create: {
      phone,
      name,
      role: UserRole.SUBSCRIBER,
      lastLoginAt: new Date(),
    },
    update: {
      name,
      lastLoginAt: new Date(),
    },
  });
}

export async function sendCustomerOtp(rawPhone: string) {
  await verifyCsrfFromRequest();
  const phone = normalizeIranPhone(rawPhone);
  phoneSchema.parse({ phone });

  try {
    const result = await createPhoneOtp(phone, await getClientIp());
    return {
      ok: true as const,
      phone,
      expiresAt: result.expiresAt.toISOString(),
      sandboxMode: result.sandboxMode,
      devCode: result.devCode,
    };
  } catch (error) {
    if (error instanceof Error && error.message === 'RATE_LIMIT_EXCEEDED') {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    throw error;
  }
}

export async function verifyCustomerOtp(rawPhone: string, code: string): Promise<CustomerSession> {
  await verifyCsrfFromRequest();
  const phone = normalizeIranPhone(rawPhone);
  verifySchema.parse({ phone, code });

  const valid = await verifyPhoneOtp(phone, code);
  if (!valid) {
    throw new Error('کد تأیید نامعتبر یا منقضی شده است.');
  }

  const subscriber = await findOrCreateSubscriberByPhone(phone);
  await syncCustomerUser(phone, subscriber.name);

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { avatar: true, name: true },
  });

  const session: CustomerSession = {
    subscriberId: subscriber.id,
    phone,
    name: user?.name ?? subscriber.name,
    email: subscriber.email,
    avatar: user?.avatar ?? null,
  };

  await setCustomerSessionCookie(session);
  revalidatePath('/profile');
  revalidatePath('/subscription');

  return session;
}

export async function logoutCustomer() {
  await verifyCsrfFromRequest();
  await clearCustomerSessionCookie();
  revalidatePath('/profile');
  revalidatePath('/subscription');
  return { ok: true as const };
}

export async function getCustomerSessionAction(): Promise<CustomerSession | null> {
  return getCustomerSession();
}

export async function requireCustomerSession(): Promise<CustomerSession> {
  const session = await getCustomerSession();
  if (!session) {
    throw new Error('LOGIN_REQUIRED');
  }
  return session;
}
