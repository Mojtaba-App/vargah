'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { requireAuth } from '@/lib/auth-utils';
import {
  acknowledgeAdminAlerts as persistAlertAcks,
  getAdminAlerts,
  toAlertSnapshots,
} from '@/lib/admin-alerts';
import { getPermissionsForRole } from '@/lib/permissions-server';
import { verifyCsrfFromRequest } from '@/lib/security/request';

const alertSnapshotsSchema = z.array(
  z.object({
    id: z.string().min(1).max(64),
    count: z.number().int().nonnegative().max(1_000_000),
  }),
);

export async function fetchAdminAlerts() {
  const session = await requireAuth();
  const permissions = await getPermissionsForRole(session.user.role);
  return getAdminAlerts(session.user.id, permissions);
}

export async function acknowledgeAdminAlertsAction(snapshots: unknown) {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  const parsed = alertSnapshotsSchema.parse(snapshots);
  await persistAlertAcks(session.user.id, parsed);
  revalidatePath('/', 'layout');
}

export async function acknowledgeCurrentAdminAlerts() {
  await verifyCsrfFromRequest();
  const session = await requireAuth();
  const permissions = await getPermissionsForRole(session.user.role);
  const alerts = await getAdminAlerts(session.user.id, permissions);
  await persistAlertAcks(session.user.id, toAlertSnapshots(alerts));
  revalidatePath('/', 'layout');
  return getAdminAlerts(session.user.id, permissions);
}
