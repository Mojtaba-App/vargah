import { setRequestLocale } from 'next-intl/server';
import { Container } from '@vargah/ui/components/container';

import { PageHeader } from '@/components/shared/page-header';

const rules = [
  {
    title: 'ارسال مقاله',
    items: [
      'مقاله باید اصیل و منتشرنشده باشد.',
      'محتوای توهین‌آمیز، تبلیغاتی مستقیم یا غیراخلاقی پذیرفته نمی‌شود.',
      'نویسنده مسئول صحت اطلاعات ارائه‌شده است.',
      'ماهنامه حق ویرایش برای انطباق با سبک نگارش را دارد.',
      'حقوق مالکیت پس از توافق و پرداخت (در صورت وجود) منتقل می‌شود.',
    ],
  },
  {
    title: 'ارسال آگهی',
    items: [
      'محتوای آگهی باید مطابق قوانین جمهوری اسلامی ایران باشد.',
      'آگهی‌های گمراه‌کننده یا کلاهبرداری پذیرفته نمی‌شوند.',
      'پرداخت قبل از انتشار الزامی است.',
      'ماهنامه حق رد آگهی بدون توضیح را دارد.',
      'بازگشت وجه فقط در صورت عدم انتشار به دلیل ماهنامه انجام می‌شود.',
    ],
  },
];

export default async function SubmissionRulesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <PageHeader
        title="قوانین ارسال آگهی و مقاله"
        description="شرایط و ضوابط ارسال محتوا به ماهنامه"
      />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl space-y-10">
          {rules.map((rule) => (
            <section key={rule.title}>
              <h2 className="mb-4 text-lg font-bold">{rule.title}</h2>
              <ul className="space-y-2">
                {rule.items.map((item) => (
                  <li key={item} className="text-muted-foreground flex items-start gap-3">
                    <span className="bg-primary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </Container>
    </>
  );
}
