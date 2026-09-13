import {
  NotificationChannel,
  NotificationStatus,
  Prisma,
  prisma,
  WebhookProvider,
} from '@vargah/database';
import { signWebhookPayload } from '@vargah/business/storage';
import { decryptSecretField } from '@vargah/security/secrets';

import { getMessagingConfig } from '@/lib/messaging-config';
import { sendEmail } from '@/lib/messaging/email';
import { sendSms } from '@/lib/messaging/sms';
import { renderTemplate } from './templates';

type DispatchInput = {
  channel: NotificationChannel;
  recipient: string;
  subject?: string;
  body: string;
  templateId?: string;
  relatedEntity?: string;
  relatedEntityId?: string;
  metadata?: Record<string, unknown>;
  scheduledAt?: Date;
  externalTemplateId?: string;
  templateVariables?: Record<string, string | number | undefined | null>;
};

async function deliver(
  channel: NotificationChannel,
  recipient: string,
  subject: string | undefined,
  body: string,
  options?: {
    externalTemplateId?: string;
    templateVariables?: Record<string, string | number | undefined | null>;
  },
) {
  const messaging = await getMessagingConfig();

  if (process.env.NODE_ENV === 'development') {
    console.info(`[notification:${channel}] → ${recipient}`, subject ?? '', body.slice(0, 120));
  }

  if (channel === NotificationChannel.EMAIL) {
    if (messaging.email.enabled) {
      await sendEmail({
        config: messaging.email,
        to: recipient,
        subject: subject ?? 'اعلان وارگه',
        text: body,
      });
      return { ok: true };
    }

    if (process.env.SMTP_HOST) {
      return { ok: true };
    }
  }

  if (channel === NotificationChannel.SMS) {
    if (messaging.sms.enabled) {
      const variables = options?.templateVariables ?? {};
      const parameters = Object.entries(variables).map(([name, value]) => ({
        name,
        value: value === undefined || value === null ? '' : String(value),
      }));

      await sendSms({
        config: messaging.sms,
        to: recipient,
        message: body,
        templateId: options?.externalTemplateId,
        parameters,
      });
      return { ok: true };
    }

    if (process.env.SMS_API_URL) {
      return { ok: true };
    }
  }

  return { ok: true };
}

export async function dispatchNotification(input: DispatchInput) {
  const notification = await prisma.notification.create({
    data: {
      channel: input.channel,
      recipient: input.recipient,
      subject: input.subject,
      body: input.body,
      templateId: input.templateId,
      relatedEntity: input.relatedEntity,
      relatedEntityId: input.relatedEntityId,
      metadata: input.metadata as Prisma.InputJsonValue | undefined,
      scheduledAt: input.scheduledAt ?? new Date(),
      status: NotificationStatus.PENDING,
    },
  });

  try {
    await deliver(input.channel, input.recipient, input.subject, input.body, {
      externalTemplateId: input.externalTemplateId,
      templateVariables: input.templateVariables,
    });
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: NotificationStatus.SENT, sentAt: new Date() },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return prisma.notification.update({
      where: { id: notification.id },
      data: { status: NotificationStatus.FAILED, errorMessage: message },
    });
  }
}

export async function dispatchFromTemplate(
  templateKey: string,
  recipient: string,
  variables: Record<string, string | number | undefined | null>,
  related?: { entity: string; entityId: string },
) {
  const template = await prisma.messageTemplate.findUnique({ where: { key: templateKey } });
  if (!template || !template.isActive) {
    throw new Error(`Template not found or inactive: ${templateKey}`);
  }

  const body = renderTemplate(template.body, variables);
  const subject = template.subject ? renderTemplate(template.subject, variables) : undefined;

  return dispatchNotification({
    channel: template.channel,
    recipient,
    subject,
    body,
    templateId: template.id,
    relatedEntity: related?.entity,
    relatedEntityId: related?.entityId,
    externalTemplateId: template.externalTemplateId ?? undefined,
    templateVariables: variables,
  });
}

type WebhookPayload = {
  event: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
};

function resolveSendMessageUrl(url: string) {
  return url.includes('sendMessage') ? url : `${url.replace(/\/$/, '')}/sendMessage`;
}

async function deliverWebhookEndpoint(
  endpoint: { name: string; url: string; provider: WebhookProvider; secret: string | null },
  payload: WebhookPayload,
) {
  const text = `${payload.title}\n${payload.message}`;

  if (
    endpoint.provider === WebhookProvider.TELEGRAM ||
    endpoint.provider === WebhookProvider.EITAA ||
    endpoint.provider === WebhookProvider.BALE
  ) {
    const markdown =
      endpoint.provider === WebhookProvider.TELEGRAM
        ? `*${payload.title}*\n${payload.message}`
        : text;
    const res = await fetch(resolveSendMessageUrl(endpoint.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: endpoint.secret,
        text: markdown,
        ...(endpoint.provider === WebhookProvider.TELEGRAM ? { parse_mode: 'Markdown' } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Webhook ${endpoint.name} failed (${res.status})`);
    }
    return;
  }

  if (endpoint.provider === WebhookProvider.SLACK) {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        ...(endpoint.secret ? { token: endpoint.secret } : {}),
      }),
    });
    if (!res.ok) {
      throw new Error(`Webhook ${endpoint.name} failed (${res.status})`);
    }
    return;
  }

  if (endpoint.provider === WebhookProvider.DISCORD) {
    const res = await fetch(endpoint.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: text.slice(0, 1900),
        embeds: [
          {
            title: payload.title.slice(0, 256),
            description: payload.message.slice(0, 2000),
            footer: { text: `event: ${payload.event}` },
          },
        ],
      }),
    });
    if (!res.ok) {
      throw new Error(`Webhook ${endpoint.name} failed (${res.status})`);
    }
    return;
  }

  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (endpoint.secret) {
    headers['X-Webhook-Secret'] = endpoint.secret;
    headers['X-Webhook-Signature'] = `sha256=${signWebhookPayload(endpoint.secret, body)}`;
  }

  const res = await fetch(endpoint.url, {
    method: 'POST',
    headers,
    body,
  });
  if (!res.ok) {
    throw new Error(`Webhook ${endpoint.name} failed (${res.status})`);
  }
}

export async function fireWebhooks(event: string, payload: Omit<WebhookPayload, 'event'>) {
  const endpoints = await prisma.webhookEndpoint.findMany({
    where: { isActive: true, events: { has: event } },
  });

  const results = await Promise.allSettled(
    endpoints.map(async (endpoint) => {
      await deliverWebhookEndpoint(
        {
          ...endpoint,
          secret: decryptSecretField(endpoint.secret),
        },
        { event, ...payload },
      );
    }),
  );

  return results;
}
