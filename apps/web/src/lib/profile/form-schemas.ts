import { z } from 'zod';

export const profileUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'نام حداقل ۲ کاراکتر باشد.')
    .max(120, 'نام حداکثر ۱۲۰ کاراکتر باشد.'),
  email: z.string().trim().email('ایمیل معتبر وارد کنید.').max(255, 'ایمیل طولانی است.'),
});

export const TICKET_TOPICS = [
  {
    value: 'اشتراک و پرداخت',
    hint: 'نام پلن، تاریخ پرداخت یا شماره پیگیری را بنویسید تا سریع‌تر بررسی شود.',
    placeholder: 'مثلاً پرداخت اشتراک در این تاریخ ناموفق بود.',
  },
  {
    value: 'ارسال نسخه چاپی',
    hint: 'اگر مجله نرسیده، آدرس پستی و بازه زمانی انتظار را بنویسید.',
    placeholder: 'شماره مجله و آدرس ارسال را بنویسید.',
  },
  {
    value: 'حساب کاربری',
    hint: 'مشکل ورود، نام یا ایمیل را توضیح دهید. شماره موبایل حساب قابل تغییر نیست.',
    placeholder: 'مشکل حساب را کوتاه و دقیق بنویسید.',
  },
  {
    value: 'محتوا و آرشیو',
    hint: 'نام شماره مجله یا عنوان مقاله را ذکر کنید.',
    placeholder: 'عنوان مطلب یا شماره مجله را بنویسید.',
  },
  {
    value: 'پیشنهاد و انتقاد',
    hint: 'نظر خود را شفاف بنویسید تا به تحریریه برسد.',
    placeholder: 'پیشنهاد یا انتقاد خود را بنویسید.',
  },
  {
    value: 'سایر',
    hint: 'موضوع را در متن پیام کامل توضیح دهید تا پشتیبانی بداند از کجا شروع کند.',
    placeholder: 'موضوع را با جزئیات بنویسید.',
  },
] as const;

const ticketSubjects = TICKET_TOPICS.map((topic) => topic.value);

export const CUSTOMER_TICKET_PRIORITIES = [
  {
    value: 'LOW',
    level: 1,
    label: 'عادی',
    hint: 'پرسش عمومی است و در نوبت عادی بررسی می‌شود.',
  },
  {
    value: 'NORMAL',
    level: 2,
    label: 'متوسط',
    hint: 'نیاز به پیگیری دارد، ولی ارسال یا پرداخت متوقف نشده است.',
  },
  {
    value: 'HIGH',
    level: 3,
    label: 'بالا',
    hint: 'اختلال در پرداخت، اشتراک یا ارسال نسخه فیزیکی؛ زودتر بررسی می‌شود.',
  },
] as const;

const ticketPriorities = CUSTOMER_TICKET_PRIORITIES.map((item) => item.value);

export const ticketCreateSchema = z.object({
  subject: z
    .string()
    .trim()
    .refine((value) => ticketSubjects.includes(value as (typeof ticketSubjects)[number]), {
      message: 'موضوع تیکت را از فهرست انتخاب کنید.',
    }),
  priority: z
    .string()
    .trim()
    .refine((value) => ticketPriorities.includes(value as (typeof ticketPriorities)[number]), {
      message: 'اولویت را از ۱ تا ۳ انتخاب کنید.',
    }),
  body: z
    .string()
    .trim()
    .min(10, 'پیام حداقل ۱۰ کاراکتر باشد تا پشتیبانی بتواند پیگیری کند.')
    .max(5000, 'پیام حداکثر ۵۰۰۰ کاراکتر باشد.'),
});

export const ticketReplySchema = z.object({
  ticketId: z.string().trim().min(1, 'تیکت نامعتبر است.'),
  body: z
    .string()
    .trim()
    .min(2, 'پاسخ حداقل ۲ کاراکتر باشد.')
    .max(5000, 'پاسخ حداکثر ۵۰۰۰ کاراکتر باشد.'),
});
