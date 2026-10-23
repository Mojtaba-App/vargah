import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { SubscriptionWorkspace } from '@/components/subscription/subscription-workspace';
import { getPublicPaymentStatus } from '@/lib/payment-config';
import { getSubscriptionPlans } from '@/lib/subscription-plans';

export const dynamic = 'force-dynamic';

export default async function SubscriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ payment?: string; ref?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);

  const [plans, payment] = await Promise.all([getSubscriptionPlans(), getPublicPaymentStatus()]);

  return (
    <>
      <PageHeader
        title="اشتراک"
        description="پلن‌های دیجیتال، چاپی و ترکیبی — با پرداخت آنلاین و مدیریت تمدید"
      />
      <Container className="py-12">
        <SubscriptionWorkspace
          plans={plans}
          paymentReady={payment.ready}
          paymentBlockReason={payment.blockReason}
          paymentStatus={query.payment ?? null}
          paymentRef={query.ref ?? null}
        />
      </Container>
    </>
  );
}
