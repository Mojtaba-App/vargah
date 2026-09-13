import { prisma } from '@vargah/database';

import { ProfileForm } from '@/components/profile/profile-form';
import { requireAuth } from '@/lib/auth-utils';

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { name: true, email: true, role: true, avatar: true },
  });

  return (
    <ProfileForm
      user={{
        name: user.name ?? 'کاربر',
        email: user.email ?? '',
        role: user.role,
        avatar: user.avatar,
      }}
    />
  );
}
