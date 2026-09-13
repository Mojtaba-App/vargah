import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';
import { DataDeletionForm } from '@/components/forms/data-deletion-form';

const sections = [
  {
    title: 'جمع‌آوری داده‌ها',
    content:
      'ما اطلاعاتی مانند نام، ایمیل، شماره تلفن و آدرس را فقط برای ارائه خدمات (اشتراک، تماس، ارسال مقاله) جمع‌آوری می‌کنیم. داده‌ها بدون رضایت شما به اشخاص ثالث فروخته نمی‌شوند.',
  },
  {
    title: 'کوکی‌ها',
    content:
      'کوکی‌های ضروری برای نشست، امنیت و عملکرد سایت استفاده می‌شوند. کوکی‌های تحلیلی (مثل Google Analytics یا Umami) فقط پس از پذیرش شما در بنر رضایت فعال می‌گردند. می‌توانید انتخاب را از تنظیمات مرورگر هم مدیریت کنید.',
  },
  {
    title: 'خبرنامه',
    content:
      'ایمیل خبرنامه فقط برای اعلام شماره‌ها و مطالب ویژه استفاده می‌شود. لغو عضویت از طریق لینک اختصاصی یا صفحه «لغو عضویت خبرنامه» امکان‌پذیر است.',
  },
  {
    title: 'امنیت داده‌ها',
    content:
      'اطلاعات شما با رمزنگاری SSL/TLS منتقل و در سرورهای امن نگهداری می‌شود. دسترسی به داده‌ها محدود به پرسnel مجاز است.',
  },
  {
    title: 'حقوق شما',
    content:
      'شما حق دسترسی، اصلاح و حذف اطلاعات شخصی خود را دارید. برای درخواست با ایمیل info@magazine.ir تماس بگیرید.',
  },
];

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader title="حریم خصوصی داده‌ها" description="نحوه جمع‌آوری، استفاده و محافظت از اطلاعات شما" />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-lg font-bold">{section.title}</h2>
              <p className="leading-relaxed text-muted-foreground">{section.content}</p>
            </section>
          ))}
          <p className="text-sm text-muted-foreground">آخرین به‌روزرسانی: شهریور ۱۴۰۵</p>
          <DataDeletionForm />
        </div>
      </Container>
    </>
  );
}
