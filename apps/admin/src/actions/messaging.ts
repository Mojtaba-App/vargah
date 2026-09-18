'use server';

import { recordAuditLog } from '@/lib/audit/record';

import { revalidatePath } from 'next/cache';
import { AuditAction, NotificationChannel, prisma } from '@vargah/database';
import { SMS_TEMPLATE_PRESETS } from '@vargah/business/sms-presets';

import { requirePermission } from '@/lib/auth-utils';
import { PERMISSIONS } from '@/lib/permissions';
import { verifyCsrfFromRequest } from '@/lib/security/request';
import { messageTemplateSchema } from '@vargah/security/schemas';

export async function upsertMessageTemplate(data: {
  key: string;
  name: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  externalTemplateId?: string;
  variables?: string[];
}) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);
  const validated = messageTemplateSchema.parse(data);

  await prisma.messageTemplate.upsert({
    where: { key: validated.key },
    create: {
      key: validated.key,
      name: validated.name,
      channel: validated.channel as NotificationChannel,
      subject: validated.subject,
      body: validated.body,
      externalTemplateId: validated.externalTemplateId,
      variables: validated.variables ?? [],
    },
    update: {
      name: validated.name,
      channel: validated.channel as NotificationChannel,
      subject: validated.subject,
      body: validated.body,
      externalTemplateId: validated.externalTemplateId,
      variables: validated.variables ?? [],
    },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'MessageTemplate',
    entityId: validated.key,
  });

  revalidatePath('/settings');
  revalidatePath('/settings/automation');
}

export async function createSmsTemplateFromPreset(presetKey: string) {
  await verifyCsrfFromRequest();
  const preset = SMS_TEMPLATE_PRESETS.find((item) => item.key === presetKey);
  if (!preset) throw new Error('الگوی آماده یافت نشد');

  await upsertMessageTemplate({
    key: preset.key,
    name: preset.name,
    channel: NotificationChannel.SMS,
    body: preset.body,
    variables: preset.variables,
  });
}

export async function deleteMessageTemplate(id: string) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);

  const template = await prisma.messageTemplate.findUnique({ where: { id } });
  if (!template) throw new Error('الگو یافت نشد');

  await prisma.messageTemplate.delete({ where: { id } });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.DELETE,
    entity: 'MessageTemplate',
    entityId: template.key,
  });

  revalidatePath('/settings');
  revalidatePath('/settings/automation');
}

export async function toggleMessageTemplate(id: string, isActive: boolean) {
  await verifyCsrfFromRequest();
  const session = await requirePermission(PERMISSIONS.SETTINGS_EDIT);

  const template = await prisma.messageTemplate.update({
    where: { id },
    data: { isActive },
  });

  await recordAuditLog({
    userId: session.user.id,
    action: AuditAction.UPDATE,
    entity: 'MessageTemplate',
    entityId: template.key,
    changes: { isActive },
  });

  revalidatePath('/settings');
  revalidatePath('/settings/automation');
}
