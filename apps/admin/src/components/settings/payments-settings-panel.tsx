'use client';

import type { PaymentConfig } from '@vargah/business/payment-config';
import Link from 'next/link';

import { PaymentSettingsForm } from '@/components/settings/payment-settings-form';

type PaymentsSettingsPanelProps = {
  paymentConfig: PaymentConfig;
  canEdit: boolean;
};

export function PaymentsSettingsPanel({ paymentConfig, canEdit }: PaymentsSettingsPanelProps) {
  return (
    <div className="space-y-6">
      <PaymentSettingsForm initialConfig={paymentConfig} canEdit={canEdit} />
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        مدیریت پلن‌های اشتراک در{' '}
        <Link href="/subscription-plans" className="font-semibold text-primary hover:underline">
          مدیریت محتوا → پلن‌های اشتراک
        </Link>{' '}
        است.
      </div>
    </div>
  );
}
