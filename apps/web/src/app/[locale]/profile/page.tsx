import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { Container } from '@vargah/ui/components/container';

import { getCustomerProfile } from '@/actions/profile';
import { PageHeader } from '@/components/shared/page-header';
import { ProfileWorkspace } from '@/components/profile/profile-workspace';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCustomerProfile();

  return (
    <>
      <PageHeader
        title="پروفایل"
        description="مدیریت حساب، اشتراک، آدرس، سوابق پرداخت و پشتیبانی"
      />
      <Container className="py-12">
        <ProfileWorkspace profile={profile} />
      </Container>
    </>
  );
}
