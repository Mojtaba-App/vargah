import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';

const sections = [
  {
    title: 'مالکیت محتوا',
    content:
      'تمام محتوای منتشرشده در ماهنامه وارگه — شامل مقالات، تصاویر، طراحی و لوگو — متعلق به ماهنامه یا نویسندگان است و تحت قوانین کپی‌رایت ایران محافظت می‌شود.',
  },
  {
    title: 'استفاده مجاز',
    content:
      'برداشت کوتاه (حداکثر ۲۰۰ کلمه) با ذکر منبع و لینک به مقاله اصلی مجاز است. بازنشر کامل، ترجمه یا استفاده تجاری بدون مجوز کتبی ممنوع است.',
  },
  {
    title: 'استفاده شخصی',
    content:
      'دانلود PDF شماره‌ها فقط برای مشترکین مجاز است. اشتراک‌گذاری فایل PDF با دیگران خلاف قوانین اشتراک است.',
  },
  {
    title: 'تخلفات',
    content: 'در صورت نقض حقوق مالکیت معنوی، ماهنامه حق پیگیری قانونی را برای خود محفوظ می‌دارد.',
  },
];

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="قوانین استفاده از محتوا"
        description="کپی‌رایت و شرایط استفاده از مطالب ماهنامه"
      />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-lg font-bold">{section.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{section.content}</p>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
