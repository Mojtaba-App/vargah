import { prisma } from '@vargah/database';
import { requiresMandatory2FA } from '@vargah/security/roles';
import { redirect } from 'next/navigation';

import { TwoFactorSetup } from '@/components/security/two-factor-setup';
import { PageHeader } from '@/components/ui/data-table';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { requireAuth } from '@/lib/auth-utils';

export default async function Setup2faPage() {
  const session = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, role: true },
  });

  if (!user || !requiresMandatory2FA(user.role)) {
    redirect('/');
  }

  if (user.twoFactorEnabled) {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="فعال‌سازی احراز هویت دو مرحله‌ای" />
      <StatusBanner
        type="info"
        message="۲FA برای نقش شما اجباری است. تا زمان تکمیل این مرحله، دسترسی به سایر بخش‌های پنل محدود است."
      />
      <TwoFactorSetup enabled={false} redirectOnSuccess="/" />
    </div>
  );
}
