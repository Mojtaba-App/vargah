import { auth } from '@/auth';
import { prisma } from '@vargah/database';
import { generateTwoFactorSecret, getTwoFactorUri } from '@vargah/security/two-factor';
import { NextResponse } from 'next/server';

import { verifyCsrfFromHttpRequest } from '@/lib/security/request';

/** secret فقط به کلاینت برمی‌گردد — تا verify موفق نشود در DB ذخیره نمی‌شود */
export async function POST(request: Request) {
  verifyCsrfFromHttpRequest(request);
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const secret = generateTwoFactorSecret();

  return NextResponse.json({
    secret,
    uri: getTwoFactorUri(secret, user.email),
  });
}
