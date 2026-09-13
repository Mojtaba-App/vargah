export type SmsTemplatePreset = {
  key: string;
  name: string;
  body: string;
  variables: string[];
  description: string;
};

export const SMS_TEMPLATE_PRESETS: SmsTemplatePreset[] = [
  {
    key: 'otp_verification',
    name: 'کد تأیید (OTP)',
    body: 'کد تأیید وارگه: {{code}}\nاعتبار: {{minutes}} دقیقه',
    variables: ['code', 'minutes'],
    description: 'ارسال کد یک‌بارمصرف ورود یا تأیید حساب',
  },
  {
    key: 'subscription_expiry_7d_sms',
    name: 'یادآور ۷ روز اشتراک',
    body: '{{name}} عزیز، {{days}} روز تا پایان اشتراک «{{plan}}» باقی مانده. تمدید: {{link}}',
    variables: ['name', 'days', 'plan', 'link'],
    description: 'یادآوری تمدید اشتراک یک هفته قبل از انقضا',
  },
  {
    key: 'subscription_expiry_1d_sms',
    name: 'یادآور ۱ روز اشتراک',
    body: '{{name}} عزیز، اشتراک شما فردا منقضی می‌شود. همین حالا تمدید کنید: {{link}}',
    variables: ['name', 'link'],
    description: 'یادآوری فوری یک روز قبل از انقضا',
  },
  {
    key: 'ticket_reply_sms',
    name: 'پاسخ تیکت',
    body: '{{name}} عزیز، پاسخ جدید برای درخواست «{{subject}}» ثبت شد. مشاهده: {{link}}',
    variables: ['name', 'subject', 'link'],
    description: 'اطلاع‌رسانی پاسخ پشتیبانی',
  },
  {
    key: 'commission_deadline_sms',
    name: 'یادآور Deadline مطلب',
    body: '{{name}} عزیز، مهلت ارسال مطلب «{{title}}» تا {{deadline}} است.',
    variables: ['name', 'title', 'deadline'],
    description: 'یادآوری مهلت تحویل مطلب',
  },
  {
    key: 'payment_success_sms',
    name: 'تأیید پرداخت',
    body: 'پرداخت {{amount}} تومان با موفقیت انجام شد. کد پیگیری: {{ref}}',
    variables: ['amount', 'ref'],
    description: 'تأیید تراکنش موفق',
  },
  {
    key: 'welcome_sms',
    name: 'خوش‌آمدگویی',
    body: '{{name}} عزیز، به وارگه خوش آمدید! از مطالب ما لذت ببرید.',
    variables: ['name'],
    description: 'پیام خوش‌آمد به کاربر جدید',
  },
];
