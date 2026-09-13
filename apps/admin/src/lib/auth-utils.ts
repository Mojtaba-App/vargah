import { redirect } from 'next/navigation';

import { hasPermissionAsync } from '@/lib/permissions-server';
import { type Permission } from '@/lib/permissions';

export async function requireAuth() {
  const { auth } = await import('@/auth');
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session;
}

export async function requirePermission(permission: Permission) {
  const session = await requireAuth();
  if (!(await hasPermissionAsync(session.user.role, permission))) {
    redirect('/?error=forbidden');
  }
  return session;
}

export async function getSessionUser() {
  const { auth } = await import('@/auth');
  const session = await auth();
  return session?.user ?? null;
}
