'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SiteConfig } from '@vargah/business/site-settings';
import type { MessagingConfig } from '@vargah/business/messaging-config';
import type { PaymentConfig } from '@vargah/business/payment-config';
import type { MapConfig } from '@vargah/business/map-config';
import type { ServicesContent } from '@vargah/business/services-content';
import type { AboutContent } from '@vargah/business/about-content';
import { Badge } from '@vargah/ui/components/badge';

import { AboutSettingsPanel } from '@/components/settings/about-settings-panel';
import {
  AutomationPanel,
  type NotificationRow,
  type WebhookRow,
} from '@/components/settings/automation-panel';
import { MapSettingsForm } from '@/components/settings/map-settings-form';
import { MessagingSettingsForm } from '@/components/settings/messaging-settings-form';
import { PaymentsSettingsPanel } from '@/components/settings/payments-settings-panel';
import { ServicesSettingsPanel } from '@/components/settings/services-settings-panel';
import { SiteSettingsForm } from '@/components/settings/site-settings-form';
import { type MessageTemplateRow } from '@/components/settings/templates-manager';
import {
  SETTINGS_TAB_DESCRIPTIONS,
  SETTINGS_TAB_LABELS,
  SETTINGS_TAB_SLUGS,
  SettingsTab,
} from '@/lib/settings/constants';
import type { DatabaseConnectionInfo } from '@/lib/database-info';
import { NotificationChannel } from '@/lib/communications/enums';
import { cn, formatNumber } from '@/lib/utils';

type SettingsWorkspaceProps = {
  initialTab?: SettingsTab;
  siteConfig: SiteConfig;
  messagingConfig: MessagingConfig;
  paymentConfig: PaymentConfig;
  mapConfig: MapConfig;
  servicesContent: ServicesContent;
  aboutContent: AboutContent;
  templates: MessageTemplateRow[];
  webhooks: WebhookRow[];
  notifications: NotificationRow[];
  canEdit: boolean;
  databaseInfo: DatabaseConnectionInfo;
};

function TabButton({
  tab,
  activeTab,
  onClick,
}: {
  tab: SettingsTab;
  activeTab: SettingsTab;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
        activeTab === tab
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground',
      )}
    >
      {SETTINGS_TAB_LABELS[tab]}
    </button>
  );
}

export function SettingsWorkspace({
  initialTab = SettingsTab.GENERAL,
  siteConfig,
  messagingConfig,
  paymentConfig,
  mapConfig,
  servicesContent,
  aboutContent,
  templates,
  webhooks,
  notifications,
  canEdit,
  databaseInfo,
}: SettingsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', SETTINGS_TAB_SLUGS[next]);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const overview = useMemo(
    () => ({
      emailEnabled: messagingConfig.email.enabled,
      smsEnabled: messagingConfig.sms.enabled,
      paymentEnabled: paymentConfig.enabled,
      activeSmsTemplates: templates.filter(
        (t) => t.isActive && t.channel === NotificationChannel.SMS,
      ).length,
      activeWebhooks: webhooks.filter((w) => w.isActive).length,
    }),
    [messagingConfig, paymentConfig, templates, webhooks],
  );

  return (
    <div className="space-y-6">
      {!canEdit && (
        <div className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
          حالت مشاهده — برای ویراخت تنظیمات به دسترسی «ویرایش تنظیمات» نیاز دارید.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => selectTab(SettingsTab.MESSAGING)}
          className="border-border bg-card hover:border-primary/40 rounded-2xl border p-4 text-start transition-colors"
        >
          <div className="flex items-center gap-2">
            <Badge variant={overview.emailEnabled ? 'default' : 'outline'}>SMTP</Badge>
            <Badge variant={overview.smsEnabled ? 'default' : 'outline'}>SMS</Badge>
            <span className="text-sm tabular-nums">
              {formatNumber(overview.activeSmsTemplates)} الگو
            </span>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">پیام‌رسانی</p>
        </button>
        <button
          type="button"
          onClick={() => selectTab(SettingsTab.PAYMENTS)}
          className="border-border bg-card hover:border-primary/40 rounded-2xl border p-4 text-start transition-colors"
        >
          <div className="flex items-center gap-2">
            <Badge variant={overview.paymentEnabled ? 'default' : 'outline'}>درگاه</Badge>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">درگاه پرداخت</p>
        </button>
        <button
          type="button"
          onClick={() => selectTab(SettingsTab.AUTOMATION)}
          className="border-border bg-card hover:border-primary/40 rounded-2xl border p-4 text-start transition-colors"
        >
          <p className="text-2xl font-bold tabular-nums">{formatNumber(overview.activeWebhooks)}</p>
          <p className="text-muted-foreground mt-1 text-sm">Webhook فعال</p>
        </button>
        <button
          type="button"
          onClick={() => selectTab(SettingsTab.GENERAL)}
          className="border-border bg-card hover:border-primary/40 rounded-2xl border p-4 text-start transition-colors"
        >
          <p className="truncate font-semibold">{siteConfig.branding.siteName}</p>
          <p className="text-muted-foreground mt-1 text-sm">هویت بصری سایت</p>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {(Object.values(SettingsTab) as SettingsTab[]).map((t) => (
          <TabButton key={t} tab={t} activeTab={tab} onClick={() => selectTab(t)} />
        ))}
      </div>

      <p className="text-muted-foreground text-sm">{SETTINGS_TAB_DESCRIPTIONS[tab]}</p>

      {tab === SettingsTab.GENERAL && (
        <SiteSettingsForm
          initialConfig={siteConfig}
          canEdit={canEdit}
          databaseInfo={databaseInfo}
        />
      )}

      {tab === SettingsTab.MESSAGING && (
        <MessagingSettingsForm
          initialConfig={messagingConfig}
          templates={templates}
          canEdit={canEdit}
        />
      )}

      {tab === SettingsTab.SERVICES && (
        <ServicesSettingsPanel initialContent={servicesContent} canEdit={canEdit} />
      )}

      {tab === SettingsTab.ABOUT && (
        <AboutSettingsPanel initialContent={aboutContent} canEdit={canEdit} />
      )}

      {tab === SettingsTab.PAYMENTS && (
        <PaymentsSettingsPanel paymentConfig={paymentConfig} canEdit={canEdit} />
      )}

      {tab === SettingsTab.MAP && <MapSettingsForm initialConfig={mapConfig} canEdit={canEdit} />}

      {tab === SettingsTab.AUTOMATION && (
        <AutomationPanel webhooks={webhooks} notifications={notifications} canEdit={canEdit} />
      )}
    </div>
  );
}

export type { SettingsTab };
