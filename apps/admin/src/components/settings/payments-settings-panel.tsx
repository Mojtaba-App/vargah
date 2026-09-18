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
      <div className="border-border bg-muted/20 text-muted-foreground rounded-2xl border border-dashed px-4 py-3 text-sm">
        مدیریت پلن‌های اشتراک در{' '}
        <Link href="/subscription-plans" className="text-primary font-semibold hover:underline">
          مدیریت محتوا → پلن‌های اشتراک
        </Link>{' '}
        است.
      </div>
    </div>
  );
}
