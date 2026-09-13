import { auth } from '@/auth';
import { prisma } from '@vargah/database';
import { verifyTwoFactorToken } from '@vargah/security/two-factor';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { setSessionCookie } from '@/lib/session-token';
import { verifyCsrfFromHttpRequest } from '@/lib/security/request';

const verifyBodySchema = z.object({
  token: z.string().length(6),
  secret: z.string().min(16).optional(),
});

export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = verifyBodySchema.parse(await request.json());
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const secretToVerify = body.secret ?? user.twoFactorSecret;
  if (!secretToVerify) {
    return NextResponse.json({ error: '2FA not initialized' }, { status: 400 });
  }

  if (!verifyTwoFactorToken(secretToVerify, body.token)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorSecret: secretToVerify,
      twoFactorEnabled: true,
    },
  });

  await setSessionCookie({
    id: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    twoFactorEnabled: true,
  });

  return NextResponse.json({ ok: true });
}
