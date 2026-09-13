'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, UserStatus } from '@vargah/database/enums';
import { Input, Label, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';
import { Badge } from '@vargah/ui/components/badge';
import { evaluatePasswordStrength } from '@vargah/security/password-strength';
import { hasAdminSmsVerification, maskPhone } from '@vargah/security/phone';

import {
  deleteAdminUser,
  updateAdminUser,
  updateAdminUserPassword,
} from '@/actions/users';
import { PasswordFields } from '@/components/users/password-fields';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ReasonConfirmDialog } from '@/components/ui/feedback/reason-confirm-dialog';
import { isNextRedirect } from '@/lib/action-state';
import { getActionErrorMessage } from '@/lib/settings/errors';
import { ROLE_LABELS } from '@/lib/permissions';
import { formatJalali } from '@/lib/utils';

const USER_DELETE_REASONS = [
  'حساب دیگر مورد نیاز نیست',
  'اشتباه در ایجاد کاربر',
  'جایگزینی با حساب جدید',
  'خروج از سازمان / پایان همکاری',
  'نقض سیاست امنیتی',
] as const;

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'فعال',
  INACTIVE: 'غیرفعال',
  SUSPENDED: 'معلق',
};

type AdminUser = {
  id: string;
  name: string | null;
  email: string | null;
  username: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type EditUserFormProps = {
  user: AdminUser;
  assignableRoles: UserRole[];
  canDelete: boolean;
  canChangePassword: boolean;
  isSelf: boolean;
};

export function EditUserForm({
  user,
  assignableRoles,
  canDelete,
  canChangePassword,
  isSelf,
}: EditUserFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isPasswordPending, startPasswordTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const strength = evaluatePasswordStrength(password);
  const canSubmitPassword =
    strength.isAcceptable && password === passwordConfirm && password.length > 0;

  const handleProfileSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await updateAdminUser(user.id, formData);
        setMessage('اطلاعات کاربر با موفقیت ذخیره شد.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const formData = new FormData(event.currentTarget);

    startPasswordTransition(async () => {
      try {
        await updateAdminUserPassword(user.id, formData);
        setPassword('');
        setPasswordConfirm('');
        setMessage('رمز عبور با موفقیت به‌روزرسانی شد.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'تغییر رمز ناموفق بود');
      }
    });
  };

  const handleDelete = (reason: string) => {
    if (isDeleting) return;
    setMessage(null);
    setError(null);

    startDelete(async () => {
      try {
        await deleteAdminUser(user.id, reason);
        setConfirmDelete(false);
        router.push('/users');
        router.refresh();
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setError(getActionErrorMessage(err, 'حذف کاربر ناموفق بود'));
      }
    });
  };

  const roleLocked = isSelf || assignableRoles.length === 0;
  const smsOtpEnabled = hasAdminSmsVerification(user.phone);

  return (
    <div className="space-y-6">
      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-2xl xl:col-span-2">
          <CardContent className="space-y-6 pt-6">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              {isSelf && user.email ? (
                <input type="hidden" name="email" value={user.email} />
              ) : null}
              {isSelf && user.username ? (
                <input type="hidden" name="username" value={user.username} />
              ) : null}
              {isSelf ? <input type="hidden" name="status" value={user.status} /> : null}
              {roleLocked ? <input type="hidden" name="role" value={user.role} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name" required>
                    نام
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={user.name ?? ''}
                    required
                    disabled={isPending}
                    className="mt-2 rounded-xl"
                  />
                </div>
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={user.email ?? ''}
                    disabled={isPending || isSelf}
                    className="mt-2 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="username">نام کاربری</Label>
                  <Input
                    id="username"
                    name="username"
                    defaultValue={user.username ?? ''}
                    disabled={isPending || isSelf}
                    placeholder="editor.vargah"
                    className="mt-2 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">موبایل (تأیید پیامکی)</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={user.phone ?? ''}
                    disabled={isPending}
                    placeholder="09121234567"
                    className="mt-2 rounded-xl text-left"
                    dir="ltr"
                  />
                </div>
                <div>
                  <Label htmlFor="role">نقش</Label>
                  <Select
                    id="role"
                    name="role"
                    defaultValue={user.role}
                    disabled={isPending || roleLocked}
                    className="mt-2"
                  >
                    {(roleLocked ? [user.role] : assignableRoles).map((role) => (
                      <option key={role} value={role}>
                        {ROLE_LABELS[role]}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">وضعیت</Label>
                  <Select
                    id="status"
                    name="status"
                    defaultValue={user.status}
                    disabled={isPending || isSelf}
                    className="mt-2"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <LoadingButton type="submit" loading={isPending} className="rounded-xl">
                ذخیره تغییرات
              </LoadingButton>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="space-y-4 pt-6 text-sm">
            <p className="font-semibold">اطلاعات حساب</p>
            <div className="space-y-2 text-muted-foreground">
              <p>
                نقش فعلی: <Badge>{ROLE_LABELS[user.role]}</Badge>
              </p>
              <p>
                وضعیت: <Badge variant={user.status === 'ACTIVE' ? 'default' : 'outline'}>{STATUS_LABELS[user.status]}</Badge>
              </p>
              <p>
                ورود دو مرحله‌ای (پیامک):{' '}
                <Badge variant={smsOtpEnabled ? 'default' : 'outline'}>
                  {smsOtpEnabled ? 'فعال' : 'غیرفعال'}
                </Badge>
              </p>
              {user.email && (
                <p dir="ltr" className="text-left">
                  ایمیل ورود: {user.email}
                </p>
              )}
              {user.username && (
                <p dir="ltr" className="text-left">
                  نام کاربری: {user.username}
                </p>
              )}
              <p dir="ltr" className="text-left">
                موبایل: {user.phone ? maskPhone(user.phone) : '— (ورود بدون پیامک ممکن نیست)'}
              </p>
              <p className="text-xs leading-relaxed">
                پس از ایمیل/نام کاربری و رمز، کد تأیید به موبایل ثبت‌شده ارسال می‌شود (مثل ورود کاربران
                سایت).
              </p>
              <p>آخرین ورود: {user.lastLoginAt ? formatJalali(user.lastLoginAt) : '—'}</p>
              <p>ایجاد: {formatJalali(user.createdAt)}</p>
              <p>به‌روزرسانی: {formatJalali(user.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {canChangePassword && (
        <Card className="rounded-2xl">
          <CardContent className="pt-6">
            <form onSubmit={handlePasswordSubmit} className="max-w-xl space-y-4">
              <p className="font-semibold">تغییر رمز عبور</p>
              <PasswordFields
                value={password}
                onChange={setPassword}
                confirmValue={passwordConfirm}
                onConfirmChange={setPasswordConfirm}
                disabled={isPasswordPending}
              />
              <LoadingButton
                type="submit"
                loading={isPasswordPending}
                disabled={!canSubmitPassword}
                className="rounded-xl"
              >
                به‌روزرسانی رمز
              </LoadingButton>
            </form>
          </CardContent>
        </Card>
      )}

      {canDelete && !isSelf && (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
            <div>
              <p className="font-semibold text-destructive">حذف کاربر</p>
              <p className="text-sm text-muted-foreground">این عمل قابل بازگشت نیست.</p>
            </div>
            <Button
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                setError(null);
                setMessage(null);
                setConfirmDelete(true);
              }}
            >
              حذف کاربر
            </Button>
          </CardContent>
        </Card>
      )}

      <ReasonConfirmDialog
        open={confirmDelete}
        title="حذف کاربر"
        description={`آیا از حذف «${user.name ?? user.email ?? 'این کاربر'}» مطمئن هستید؟ سوابق محتوا به حساب شما منتقل می‌شود.`}
        confirmLabel="حذف قطعی"
        reasons={USER_DELETE_REASONS}
        loading={isDeleting}
        serverError={error}
        onConfirm={handleDelete}
        onCancel={() => {
          if (isDeleting) return;
          setConfirmDelete(false);
        }}
      />
    </div>
  );
}
