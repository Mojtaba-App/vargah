import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { UnsubscribeForm } from '@/components/newsletter/unsubscribe-form';

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function UnsubscribePage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { token } = await searchParams;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="لغو عضویت خبرنامه"
        description="می‌توانید هر زمان دریافت ایمیل‌های خبرنامه را متوقف کنید"
      />
      <Container className="py-12">
        <div className="mx-auto max-w-lg">
          <UnsubscribeForm initialToken={token ?? ''} />
        </div>
      </Container>
    </>
  );
}
