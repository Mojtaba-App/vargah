'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserRole, UserStatus } from '@vargah/database/enums';
import { adminUserCreateFormSchema } from '@vargah/security/schemas/admin-user';
import { Input, Label, Select } from '@vargah/ui/components/input';
import { Card, CardContent } from '@vargah/ui/components/card';

import { createAdminUser } from '@/actions/users';
import { PasswordFields } from '@/components/users/password-fields';
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { isNextRedirect } from '@/lib/action-state';
import { ROLE_LABELS } from '@/lib/permissions';
import type { z } from 'zod';

const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'فعال',
  INACTIVE: 'غیرفعال',
  SUSPENDED: 'معلق',
};

type FormValues = z.infer<typeof adminUserCreateFormSchema>;

type CreateUserFormProps = {
  assignableRoles: UserRole[];
};

export function CreateUserForm({ assignableRoles }: CreateUserFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const defaultRole = assignableRoles.includes(UserRole.WRITER)
    ? UserRole.WRITER
    : assignableRoles[0]!;

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm<FormValues>({
    resolver: zodResolver(adminUserCreateFormSchema),
    mode: 'onTouched',
    reValidateMode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      username: '',
      phone: '',
      role: defaultRole as FormValues['role'],
      status: UserStatus.ACTIVE,
      password: '',
      passwordConfirm: '',
    },
  });

  const email = watch('email');
  const username = watch('username');
  const loginHint = email || username;

  const onSubmit = handleSubmit((values) => {
    setServerError(null);
    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('email', values.email ?? '');
    formData.set('username', values.username ?? '');
    formData.set('phone', values.phone ?? '');
    formData.set('role', values.role);
    formData.set('status', values.status);
    formData.set('password', values.password);
    formData.set('passwordConfirm', values.passwordConfirm);

    startTransition(async () => {
      try {
        await createAdminUser(formData);
      } catch (err) {
        if (isNextRedirect(err)) throw err;
        setServerError(err instanceof Error ? err.message : 'ایجاد کاربر ناموفق بود');
      }
    });
  });

  return (
    <Card className="rounded-2xl">
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          {serverError && <StatusBanner type="error" message={serverError} />}
          {isSubmitted && Object.keys(errors).length > 0 && (
            <StatusBanner type="error" message="لطفاً خطاهای فرم را برطرف کنید." />
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" required>
                  نام کامل
                </Label>
                <Input
                  id="name"
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  aria-invalid={Boolean(errors.name)}
                  {...register('name')}
                />
                <FieldMessage message={errors.name?.message} />
              </div>

              <div>
                <Label htmlFor="email">ایمیل (شناسه ورود)</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  dir="ltr"
                  aria-invalid={Boolean(errors.email)}
                  {...register('email')}
                />
                <FieldMessage message={errors.email?.message} />
              </div>

              <div>
                <Label htmlFor="username">نام کاربری (شناسه ورود)</Label>
                <Input
                  id="username"
                  disabled={isPending}
                  className="mt-2 rounded-xl"
                  dir="ltr"
                  placeholder="editor.vargah"
                  aria-invalid={Boolean(errors.username)}
                  {...register('username')}
                />
                <FieldMessage message={errors.username?.message} />
                <FieldHint>حداقل یکی از ایمیل یا نام کاربری برای ورود الزامی است.</FieldHint>
              </div>

              <div>
                <Label htmlFor="phone" required>
                  موبایل (تأیید پیامکی)
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  disabled={isPending}
                  placeholder="09121234567"
                  className="mt-2 rounded-xl"
                  dir="ltr"
                  aria-invalid={Boolean(errors.phone)}
                  {...register('phone')}
                />
                <FieldMessage message={errors.phone?.message} />
                <FieldHint>کد ورود به این شماره ارسال می‌شود؛ در صفحه لاگین وارد نمی‌شود.</FieldHint>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-border p-4">
                <p className="mb-3 text-sm font-semibold">نقش و وضعیت</p>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="role" required>
                      نقش
                    </Label>
                    <Select
                      id="role"
                      disabled={isPending}
                      className="mt-2"
                      aria-invalid={Boolean(errors.role)}
                      {...register('role')}
                    >
                      {assignableRoles.map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </Select>
                    <FieldMessage message={errors.role?.message} />
                  </div>
                  <div>
                    <Label htmlFor="status">وضعیت</Label>
                    <Select id="status" disabled={isPending} className="mt-2" {...register('status')}>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <Controller
                  name="password"
                  control={control}
                  render={({ field: passwordField }) => (
                    <Controller
                      name="passwordConfirm"
                      control={control}
                      render={({ field: confirmField }) => (
                        <PasswordFields
                          value={passwordField.value}
                          onChange={passwordField.onChange}
                          onBlur={passwordField.onBlur}
                          confirmValue={confirmField.value}
                          onConfirmChange={confirmField.onChange}
                          onConfirmBlur={confirmField.onBlur}
                          email={loginHint}
                          disabled={isPending}
                          error={errors.password?.message}
                          confirmError={errors.passwordConfirm?.message}
                        />
                      )}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-border pt-4">
            <LoadingButton
              type="submit"
              loading={isPending}
              loadingText="در حال ایجاد..."
              className="rounded-xl"
            >
              ایجاد کاربر
            </LoadingButton>
            <LoadingButton
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => router.push('/users')}
            >
              انصراف
            </LoadingButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
