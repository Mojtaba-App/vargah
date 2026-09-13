import type { SeedContext, SeedUsers } from './types';

export async function seedCrm(ctx: SeedContext, users: SeedUsers) {
  const { prisma } = ctx;

  await prisma.subscriber.createMany({
    data: [
      {
        name: 'علی محمدی',
        email: 'ali@example.com',
        phone: '09121234567',
        province: 'تهران',
        city: 'تهران',
        status: 'ACTIVE',
        planType: 'digital-yearly',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        name: 'مریم رضایی',
        email: 'maryam@example.com',
        province: 'خراسان رضوی',
        city: 'مشهد',
        status: 'EXPIRED',
        planType: 'digital-monthly',
      },
      {
        name: 'حسین کریمی',
        email: 'hossein@example.com',
        province: 'فارس',
        city: 'شیراز',
        status: 'PENDING_PAYMENT',
        planType: 'combo-yearly',
      },
    ],
    skipDuplicates: true,
  });

  const contributor = await prisma.contributor.upsert({
    where: { userId: users.writer.id },
    update: {},
    create: {
      userId: users.writer.id,
      type: 'WRITER',
      bio: 'نویسنده و گزارشگر',
    },
  });

  await prisma.ticket.createMany({
    data: [
      {
        subject: 'تمدید اشتراک',
        body: 'می‌خواهم اشتراک سالانه را تمدید کنم.',
        customerType: 'SUBSCRIBER',
        customerName: 'علی محمدی',
        customerEmail: 'ali@example.com',
        priority: 'NORMAL',
      },
      {
        subject: 'پیگیری کمپین تبلیغاتی',
        body: 'وضعیت آگهی شماره ۱۲ چیست؟',
        customerType: 'ADVERTISER',
        customerName: 'شرکت الف',
        customerEmail: 'ads@example.com',
        priority: 'HIGH',
      },
    ],
  });

  await prisma.articleCommission.create({
    data: {
      title: 'گزارش از کوچ بهاره',
      description: 'گزارش تصویری از عشایر در فصل کوچ',
      createdById: users.editor.id,
      assigneeId: users.writer.id,
      contributorId: contributor.id,
      status: 'IN_WRITING',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  console.log('   🤝 crm — مشترکین، تیکت‌ها، سفارش مطلب');
}
