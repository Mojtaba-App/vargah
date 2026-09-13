import { cookies, headers } from 'next/headers';
import { prisma } from '@vargah/database';
import { generateOpaqueToken, hashToken } from '@vargah/business/storage';

export type CustomerSession = {
  subscriberId: string;
  phone: string;
  name: string;
  email: string;
  avatar?: string | null;
};

export const CUSTOMER_SESSION_COOKIE = 'vargah_customer_session';
const SESSION_MAX_AGE = 90 * 24 * 60 * 60;

function isProd() {
  return process.env.NODE_ENV === 'production';
}

async function clientMeta() {
  const h = await headers();
  return {
    userAgent: h.get('user-agent')?.slice(0, 512) ?? null,
    ipAddress: h.get('x-forwarded-for')?.split(',')[0]?.trim()?.slice(0, 64) ?? null,
  };
}

export async function getCustomerSession(): Promise<CustomerSession | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (!raw || !process.env.DATABASE_URL) return null;

  const tokenHash = hashToken(raw);
  const row = await prisma.customerSession.findUnique({
    where: { tokenHash },
    include: {
      subscriber: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
  });

  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  const phone = row.subscriber.phone?.trim();
  if (!phone) return null;

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { avatar: true, name: true },
  });

  return {
    subscriberId: row.subscriber.id,
    phone,
    name: user?.name ?? row.subscriber.name ?? 'مشترک',
    email: row.subscriber.email ?? '',
    avatar: user?.avatar ?? null,
  };
}

export async function setCustomerSessionCookie(data: CustomerSession): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL missing');
  }

  const cookieStore = await cookies();
  const previous = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (previous) {
    await prisma.customerSession
      .updateMany({
        where: { tokenHash: hashToken(previous), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  const raw = generateOpaqueToken();
  const meta = await clientMeta();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await prisma.customerSession.create({
    data: {
      subscriberId: data.subscriberId,
      tokenHash: hashToken(raw),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    },
  });

  cookieStore.set(CUSTOMER_SESSION_COOKIE, raw, {
    httpOnly: true,
    secure: isProd(),
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearCustomerSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(CUSTOMER_SESSION_COOKIE)?.value;
  if (raw && process.env.DATABASE_URL) {
    await prisma.customerSession
      .updateMany({
        where: { tokenHash: hashToken(raw), revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }
  cookieStore.delete(CUSTOMER_SESSION_COOKIE);
}

export async function revokeAllCustomerSessions(subscriberId: string): Promise<void> {
  if (!process.env.DATABASE_URL) return;
  await prisma.customerSession.updateMany({
    where: { subscriberId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
