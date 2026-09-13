import { UserRole, UserStatus } from '@prisma/client';
import { hash } from 'bcryptjs';

import type { SeedContext, SeedUsers } from './types';

export async function seedUsers({ prisma }: SeedContext): Promise<SeedUsers> {
  const passwordHash = await hash('admin1234', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@magazine.ir' },
    update: {
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      phone: '09120000001',
      username: 'admin',
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
    create: {
      email: 'admin@magazine.ir',
      username: 'admin',
      name: 'مدیر کل',
      phone: '09120000001',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      twoFactorEnabled: false,
    },
  });

  const editor = await prisma.user.upsert({
    where: { email: 'editor@magazine.ir' },
    update: { phone: '09120000002', username: 'editor' },
    create: {
      email: 'editor@magazine.ir',
      username: 'editor',
      name: 'سردبیر',
      phone: '09120000002',
      passwordHash: await hash('editor1234', 12),
      role: UserRole.EDITOR_IN_CHIEF,
      status: UserStatus.ACTIVE,
    },
  });

  const writer = await prisma.user.upsert({
    where: { email: 'writer@magazine.ir' },
    update: { phone: '09120000003', username: 'writer' },
    create: {
      email: 'writer@magazine.ir',
      username: 'writer',
      name: 'نویسنده نمونه',
      phone: '09120000003',
      passwordHash: await hash('writer1234', 12),
      role: UserRole.WRITER,
      status: UserStatus.ACTIVE,
    },
  });

  console.log('   👤 users — admin@magazine.ir / admin1234 (+ SMS OTP در dev)');
  console.log('              editor@magazine.ir / editor1234');
  console.log('              writer@magazine.ir / writer1234');

  return { admin, editor, writer };
}
