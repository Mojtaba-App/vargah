'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { Button } from '@vargah/ui/components/button';
import { Input, Label } from '@vargah/ui/components/input';

import { removeProfileAvatar, updateProfile } from '@/actions/profile';
import { UserAvatar } from '@/components/layout/user-avatar';
import {
  CameraIcon,
  ImageIcon,
  MailIcon,
  ShieldIcon,
  UserIcon,
} from '@/components/profile/profile-icons';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { adminApiPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';
import { ROLE_LABELS } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type ProfileFormProps = {
  user: {
    name: string;
    email: string;
    role: keyof typeof ROLE_LABELS;
    avatar: string | null;
  };
};

async function parseJsonResponse<T>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function FieldIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-muted/80 text-muted-foreground pointer-events-none absolute start-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg">
      {children}
    </span>
  );
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const hasNameChange = name.trim() !== user.name.trim();
  const isBusy = isPending || isUploading;

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  const displayAvatar = previewUrl ?? avatar;

  const handleSave = () => {
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.set('name', name);

    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage('پروفایل با موفقیت ذخیره شد.');
      router.refresh();
    });
  };

  const uploadAvatar = async (file: File) => {
    setError(null);
    setMessage(null);

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set('avatar', file);

      const res = await fetch(adminApiPath('/api/profile/avatar'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: formData,
        credentials: 'include',
      });

      const data = await parseJsonResponse<{ error?: string; avatar?: string }>(res);
      if (!res.ok || !data?.avatar) {
        setError(data?.error ?? 'آپلود تصویر ناموفق بود');
        setPreviewUrl(null);
        if (previewUrlRef.current) {
          URL.revokeObjectURL(previewUrlRef.current);
          previewUrlRef.current = null;
        }
        return;
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setAvatar(data.avatar);
      setMessage('تصویر پروفایل به‌روزرسانی شد.');
      router.refresh();
    } catch {
      setError('خطا در آپلود تصویر');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    if (isBusy) return;

    const file = event.dataTransfer.files?.[0];
    if (!file?.type.startsWith('image/')) {
      setError('فقط فایل تصویری مجاز است.');
      return;
    }
    await uploadAvatar(file);
  };

  const handleRemoveAvatar = () => {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      await removeProfileAvatar();
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setAvatar(null);
      setMessage('تصویر پروفایل حذف شد.');
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Hero */}
      <section className="border-border/80 bg-card relative overflow-hidden rounded-3xl border shadow-sm">
        <div
          className="from-primary/20 via-primary/5 absolute inset-0 bg-gradient-to-bl to-transparent"
          aria-hidden="true"
        />
        <div
          className="bg-primary/10 absolute -start-16 -top-16 size-56 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -end-10 -bottom-20 size-48 rounded-full bg-violet-500/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative px-6 pt-8 pb-6 sm:px-8 sm:pb-8">
          <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">حساب کاربری</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">پروفایل من</h1>
          <p className="text-muted-foreground mt-2 max-w-lg text-sm">
            نام نمایشی و تصویر پروفایل خود را مدیریت کنید.
          </p>

          <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            <div className="relative">
              <div className="from-primary/30 rounded-full bg-gradient-to-br to-violet-500/20 p-1">
                <UserAvatar
                  name={name}
                  avatar={displayAvatar}
                  size="xl"
                  className="ring-card ring-4"
                />
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="border-card bg-primary text-primary-foreground absolute -end-1 -bottom-1 flex size-10 items-center justify-center rounded-full border-2 shadow-lg transition-transform hover:scale-105 disabled:opacity-60"
                aria-label="تغییر تصویر پروفایل"
              >
                <CameraIcon className="size-4" />
              </button>
            </div>

            <div className="text-center sm:pb-1 sm:text-start">
              <h2 className="text-xl font-bold">{name || 'کاربر'}</h2>
              <p className="text-muted-foreground mt-1 text-sm" dir="ltr">
                {user.email}
              </p>
              <span className="border-primary/20 bg-primary/10 text-primary mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold">
                <ShieldIcon className="size-3.5" />
                {ROLE_LABELS[user.role]}
              </span>
            </div>
          </div>
        </div>
      </section>

      {(error || message) && (
        <StatusBanner type={error ? 'error' : 'success'} message={error ?? message!} />
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Avatar upload */}
        <section className="surface-card overflow-hidden lg:col-span-2">
          <div className="border-border/80 border-b px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-xl">
                <ImageIcon className="size-4.5" />
              </span>
              <div>
                <h2 className="font-bold">تصویر پروفایل</h2>
                <p className="text-muted-foreground text-xs">JPG، PNG یا WebP — حداکثر ۲ مگابایت</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isBusy) setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              disabled={isBusy}
              className={cn(
                'flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-4 py-8 transition-colors',
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/40',
                isBusy && 'pointer-events-none opacity-60',
              )}
            >
              <span className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-2xl">
                {isUploading ? (
                  <span className="border-primary size-5 animate-spin rounded-full border-2 border-t-transparent" />
                ) : (
                  <CameraIcon className="size-5" />
                )}
              </span>
              <span className="text-sm font-medium">
                {isUploading ? 'در حال آپلود...' : 'کلیک کنید یا تصویر را بکشید'}
              </span>
              <span className="text-muted-foreground text-xs">
                پیشنهاد: تصویر مربعی با حداقل ۲۵۶×۲۵۶
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="sr-only"
              onChange={handleAvatarChange}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1 rounded-xl"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
              >
                انتخاب فایل
              </Button>
              {(avatar || previewUrl) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl"
                  disabled={isBusy}
                  onClick={handleRemoveAvatar}
                >
                  حذف تصویر
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Account info */}
        <section className="surface-card overflow-hidden lg:col-span-3">
          <div className="border-border/80 border-b px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <UserIcon className="size-4.5" />
              </span>
              <div>
                <h2 className="font-bold">اطلاعات حساب</h2>
                <p className="text-muted-foreground text-xs">جزئیات نمایشی و دسترسی شما</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <Label htmlFor="profile-name" required>
                نام نمایشی
              </Label>
              <div className="relative mt-2">
                <FieldIcon>
                  <UserIcon className="size-4" />
                </FieldIcon>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl ps-14"
                  disabled={isPending}
                  placeholder="نام شما در پنل"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="profile-email">ایمیل</Label>
              <div className="relative mt-2">
                <FieldIcon>
                  <MailIcon className="size-4" />
                </FieldIcon>
                <Input
                  id="profile-email"
                  value={user.email}
                  readOnly
                  dir="ltr"
                  className="bg-muted/30 h-12 rounded-xl ps-14 text-start"
                />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">ایمیل قابل تغییر نیست.</p>
            </div>

            <div>
              <Label htmlFor="profile-role">نقش دسترسی</Label>
              <div className="relative mt-2">
                <FieldIcon>
                  <ShieldIcon className="size-4" />
                </FieldIcon>
                <Input
                  id="profile-role"
                  value={ROLE_LABELS[user.role]}
                  readOnly
                  className="bg-muted/30 h-12 rounded-xl ps-14"
                />
              </div>
            </div>
          </div>

          <div className="border-border/80 bg-muted/15 flex flex-col-reverse gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              {hasNameChange ? 'تغییرات ذخیره‌نشده دارید' : 'همه تغییرات ذخیره شده‌اند'}
            </p>
            <LoadingButton
              type="button"
              className="rounded-xl px-8"
              loading={isPending}
              loadingText="در حال ذخیره..."
              disabled={isBusy || !hasNameChange}
              onClick={handleSave}
            >
              ذخیره تغییرات
            </LoadingButton>
          </div>
        </section>
      </div>
    </div>
  );
}
