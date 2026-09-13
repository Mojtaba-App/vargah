import type { SeedContext } from './types';

export async function seedMessages({ prisma }: SeedContext) {
  await prisma.message.createMany({
    data: [
      {
        type: 'CONTACT',
        senderName: 'کاربر سایت',
        senderEmail: 'user@test.com',
        subject: 'سوال اشتراک',
        body: 'چگونه اشتراک بگیرم؟',
      },
      {
        type: 'COLLABORATION',
        senderName: 'نویسنده',
        senderEmail: 'author@test.com',
        subject: 'ارسال مقاله',
        body: 'مقاله پیوست شد.',
      },
      {
        type: 'ADVERTISEMENT',
        senderName: 'شرکت الف',
        senderPhone: '02112345678',
        subject: 'درخواست آگهی',
        body: 'تمام‌صفحه شماره بعد',
      },
    ],
    skipDuplicates: true,
  });

  console.log('   📬 messages — پیام‌های تماس/همکاری/تبلیغ');
}
