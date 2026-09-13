import { prisma } from '@vargah/database';
import { PageHeader } from '@/components/ui/data-table';
import { SettingsWorkspace } from '@/components/settings/settings-workspace';
import { NotificationStatus, SettingsTab, resolveSettingsTab } from '@/lib/settings/constants';
import { requireAuth, requirePermission } from '@/lib/auth-utils';
import { getMessagingConfig } from '@/lib/messaging-config';
import { getMapConfig } from '@/lib/map-config';
import { getPaymentConfig } from '@/lib/payment-config';
import { getServicesContent } from '@/lib/services-content';
import { getAboutContent } from '@/lib/about-content';
import { getSiteConfig } from '@/lib/site-config';
import { PERMISSIONS } from '@/lib/permissions';
import { hasPermissionAsync } from '@/lib/permissions-server';
import { getDatabaseConnectionInfo } from '@/lib/database-info';
import {
  toClientMapConfig,
  toClientMessagingConfig,
  toClientPaymentConfig,
  toClientWebhookSecret,
} from '@/lib/settings/client-secrets';
import { decryptSecretField } from '@vargah/security/secrets';

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

function resolveInitialTab(tab?: string): SettingsTab {
  return resolveSettingsTab(tab);
}

export default async function SettingsPage({ searchParams }: PageProps) {
  await requirePermission(PERMISSIONS.SETTINGS_VIEW);
  const session = await requireAuth();
  const params = await searchParams;

  const [config, messagingConfig, paymentConfig, mapConfig, servicesContent, aboutContent, templates, webhooks, notifications] =
    await Promise.all([
    getSiteConfig(),
    getMessagingConfig(),
    getPaymentConfig(),
    getMapConfig(),
    getServicesContent(),
    getAboutContent(),
    prisma.messageTemplate.findMany({ orderBy: [{ channel: 'asc' }, { name: 'asc' }] }),
    prisma.webhookEndpoint.findMany({ orderBy: { name: 'asc' } }),
    prisma.notification.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);

  const canEdit = await hasPermissionAsync(session.user.role, PERMISSIONS.SETTINGS_EDIT);
  const databaseInfo = getDatabaseConnectionInfo();

  return (
    <div className="space-y-6">
      <PageHeader
        title="تنظیمات"
        description="برندینگ، پیام‌رسانی، الگوها و اتوماسیون — مدیریت یکپارچه پیکربندی سایت"
      />
      <SettingsWorkspace
        initialTab={resolveInitialTab(params.tab)}
        siteConfig={config}
        messagingConfig={toClientMessagingConfig(messagingConfig)}
        paymentConfig={toClientPaymentConfig(paymentConfig)}
        mapConfig={toClientMapConfig(mapConfig)}
        servicesContent={servicesContent}
        aboutContent={aboutContent}
        templates={templates.map((t) => ({
          id: t.id,
          key: t.key,
          name: t.name,
          channel: t.channel,
          subject: t.subject,
          body: t.body,
          externalTemplateId: t.externalTemplateId,
          variables: t.variables,
          isActive: t.isActive,
        }))}
        webhooks={webhooks.map((w) => ({
          id: w.id,
          name: w.name,
          url: w.url,
          provider: w.provider,
          secret: toClientWebhookSecret(decryptSecretField(w.secret)),
          events: w.events,
          isActive: w.isActive,
          createdAt: w.createdAt,
        }))}
        notifications={notifications.map((n) => ({
          id: n.id,
          channel: n.channel,
          status: n.status as (typeof NotificationStatus)[keyof typeof NotificationStatus],
          recipient: n.recipient,
          subject: n.subject,
          body: n.body,
          errorMessage: n.errorMessage,
          sentAt: n.sentAt,
          createdAt: n.createdAt,
        }))}
        canEdit={canEdit}
        databaseInfo={databaseInfo}
      />
    </div>
  );
}
