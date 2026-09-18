'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { AuditAction, prisma, WebhookProvider } from '@vargah/database';
import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { runAllReminders } from '@/lib/communications/reminders';
import { testWebhookConnection } from '@/lib/communications/webhook-test';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { webhookSchema } from '@vargah/security/schemas';
import { encryptSecret, decryptSecretField } from '@vargah/security/secrets';
import { formatWebhookFeedbackMessage } from '@/lib/settings/errors';
import { SETTINGS_SECRET_PLACEHOLDER } from '@/lib/settings-secrets';

function revalidateAutomation() {
  revalidatePath('/settings');
  revalidatePath('/settings/automation');
}

async function resolveWebhookSecret(
  incoming: string | undefined,
  existingId?: string,
): Promise<string | null | undefined> {
  if (incoming === SETTINGS_SECRET_PLACEHOLDER) {
    if (!existingId) return null;
    const current = await prisma.webhookEndpoint.findUnique({
      where: { id: existingId },
      select: { secret: true },
    });
    return current?.secret ?? null;
  }
  if (incoming === undefined) return undefined;
  if (!incoming) return null;
  return encryptSecret(incoming);
}

export async function upsertWebhook(data: {
  id?: string;
  name: string;
  url: string;
  provider: WebhookProvider;
  secret?: string;
  events: string[];
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const validated = webhookSchema.parse({
    name: data.name,
    url: data.url,
    provider: data.provider,
    secret: data.secret === SETTINGS_SECRET_PLACEHOLDER ? undefined : data.secret,
    events: data.events,
  });

  const secret = await resolveWebhookSecret(data.secret, data.id);

  if (data.id) {
    await prisma.webhookEndpoint.update({
      where: { id: data.id },
      data: {
        name: validated.name,
        url: validated.url,
        provider: data.provider,
        ...(secret !== undefined ? { secret } : {}),
        events: validated.events,
      },
    });
  } else {
    await prisma.webhookEndpoint.create({
      data: {
        name: validated.name,
        url: validated.url,
        provider: data.provider,
        secret: secret ?? null,
        events: validated.events,
      },
    });
  }

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'WebhookEndpoint',
  });

  revalidateAutomation();
}

export async function toggleWebhook(id: string, isActive: boolean) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  await prisma.webhookEndpoint.update({ where: { id }, data: { isActive } });
  revalidateAutomation();
}

export async function deleteWebhook(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const webhook = await prisma.webhookEndpoint.findUnique({ where: { id } });
  if (!webhook) throw new Error('Webhook یافت نشد');

  await prisma.webhookEndpoint.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'WebhookEndpoint',
    entityId: id,
  });

  revalidateAutomation();
}

export async function testWebhookSettings(data: {
  url: string;
  provider: WebhookProvider;
  secret?: string;
  webhookId?: string;
}) {
  await verifyCsrfFromRequest();
  await requirePermission(PERMISSIONS.SETTINGS_EDIT);

  let secret = data.secret;
  if ((secret === SETTINGS_SECRET_PLACEHOLDER || !secret) && data.webhookId) {
    const row = await prisma.webhookEndpoint.findUnique({
      where: { id: data.webhookId },
      select: { secret: true },
    });
    secret = decryptSecretField(row?.secret) ?? undefined;
  } else if (secret === SETTINGS_SECRET_PLACEHOLDER) {
    secret = undefined;
  }

  try {
    const message = await testWebhookConnection({
      url: data.url,
      provider: data.provider,
      secret,
    });
    return { ok: true as const, message };
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'تست Webhook ناموفق بود';
    return { ok: false as const, message: formatWebhookFeedbackMessage(raw) };
  }
}

export async function runRemindersNow() {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const result = await runAllReminders();
  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'ReminderJob',
    changes: result as object,
  });
  revalidateAutomation();
}
