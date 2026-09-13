import type { JobOpening } from '../types';

export const jobOpenings: JobOpening[] = [
  {
    id: 'job-1',
    title: 'نویسنده تحلیلی — بخش اقتصاد',
    type: 'freelance',
    description: 'به نویسنده با سابقه تحلیل اقتصادی برای نگارش ۲ مقاله در ماه نیاز داریم.',
    deadline: '2026-09-30',
  },
  {
    id: 'job-2',
    title: 'طراح گرافیک',
    type: 'fulltime',
    description: 'طراح خلاق برای طراحی کاور شماره‌ها و اینفوگرافیک مقالات.',
    deadline: '2026-10-15',
  },
  {
    id: 'job-3',
    title: 'خبرنگار حوزه فناوری',
    type: 'freelance',
    description: 'پوشش اخبار و گزارش از رویدادهای فناوری.',
    deadline: '2026-09-20',
  },
];

export const writingGuidelines = [
  {
    title: 'ساختار مقاله',
    content: 'مقالات باید شامل مقدمه، بدنه (با زیرعنوان‌ها) و نتیجه‌گیری باشند. طول پیشنهادی: ۱۵۰۰ تا ۳۰۰۰ کلمه.',
  },
  {
    title: 'سبک نگارش',
    content: 'از زبان رسمی-عامیانه استفاده کنید. جملات کوتاه و روان، پاراگراف‌های حداکثر ۵ خط.',
  },
  {
    title: 'منابع',
    content: 'تمام ادعاها باید منبع داشته باشند. از لینک‌دهی و پاورقی استفاده کنید.',
  },
  {
    title: 'تصاویر',
    content: 'تصاویر باید حقوق استفاده داشته باشند. رزولوشن حداقل 1200px عرض.',
  },
  {
    title: 'فرمت ارسال',
    content: 'فایل Word یا Google Docs. فونت وزیرمتن، سایز ۱۴.',
  },
];

/**
 * @deprecated Prefer `getSiteConfig().contact.social` via `getActiveSocialLinks`.
 */
export { DEFAULT_SITE_SOCIAL as socialLinks } from '@vargah/business/site-settings';

export const officeLocation = {
  address: 'تهران، خیابان ولیعصر، بالاتر از میدان ونک، پلاک ۱۲۳۴، واحد ۵',
  lat: 35.7575,
  lng: 51.41,
  phone: '021-12345678',
  email: 'info@magazine.ir',
};
