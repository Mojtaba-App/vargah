'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@vargah/ui/components/button';

import { useCustomerAuth } from '@/components/auth/customer-auth-provider';
import { FormActionButton } from '@/components/shared/form-action-button';
import { CustomerAvatar } from '@/components/shared/customer-avatar';
import { cn } from '@/lib/utils';

type ProfileAvatarEditorProps = {
  name: string;
  avatar: string | null;
};

export function ProfileAvatarEditor({ name, avatar: initialAvatar }: ProfileAvatarEditorProps) {
  const router = useRouter();
  const { setCustomer, customer } = useCustomerAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    setAvatar(initialAvatar);
  }, [initialAvatar]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  const displayAvatar = previewUrl ?? avatar;

  const syncSessionAvatar = (nextAvatar: string | null) => {
    if (!customer) return;
    setCustomer({ ...customer, avatar: nextAvatar });
  };

  const uploadAvatar = async (file: File) => {
    setError(null);
    setMessage(null);

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const localPreview = URL.createObjectURL(file);
    previewUrlRef.current = localPreview;
    setPreviewUrl(localPreview);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.set('avatar', file);

      const res = await fetch('/api/customer/avatar', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = (await res.json()) as { error?: string; avatar?: string };
      if (!res.ok || !data.avatar) {
        setError(data.error ?? 'آپلود تصویر ناموفق بود');
        setPreviewUrl(null);
        return;
      }

      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
      setPreviewUrl(null);
      setAvatar(data.avatar);
      syncSessionAvatar(data.avatar);
      setMessage('تصویر پروفایل به‌روزرسانی شد.');
      router.replace('/profile?tab=account', { scroll: false });
      router.refresh();
    } catch {
      setError('خطا در آپلود تصویر');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAvatar = async () => {
    setError(null);
    setMessage(null);
    setIsUploading(true);
    try {
      const res = await fetch('/api/customer/avatar', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'حذف تصویر ناموفق بود');
        return;
      }
      setAvatar(null);
      syncSessionAvatar(null);
      setMessage('تصویر پروفایل حذف شد.');
      router.replace('/profile?tab=account', { scroll: false });
      router.refresh();
    } catch {
      setError('خطا در حذف تصویر');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAvatar(file);
  };

  return (
    <div className="border-border bg-muted/20 rounded-2xl border p-5">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="relative">
          <CustomerAvatar name={name} avatar={displayAvatar} size="lg" />
          <button
            type="button"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="border-border bg-background hover:bg-muted absolute -end-1 -bottom-1 inline-flex size-9 items-center justify-center rounded-full border shadow-sm transition-colors"
            aria-label="تغییر تصویر پروفایل"
          >
            <CameraIcon />
          </button>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-start">
          <h3 className="font-semibold">تصویر پروفایل</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            JPG، PNG یا WebP — حداکثر ۲ مگابایت. این تصویر در هدر سایت هم نمایش داده می‌شود.
          </p>

          <div
            className={cn(
              'mt-4 rounded-xl border border-dashed px-4 py-5 text-center transition-colors',
              isDragOver ? 'border-primary bg-primary/5' : 'border-border',
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) await uploadAvatar(file);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />
            <p className="text-muted-foreground text-sm">فایل را بکشید و رها کنید یا</p>
            <FormActionButton
              type="button"
              variant="secondary"
              className="mt-2 h-9 min-w-0 px-4 text-xs"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? 'در حال آپلود...' : 'انتخاب تصویر'}
            </FormActionButton>
          </div>

          {avatar && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive mt-2"
              disabled={isUploading}
              onClick={removeAvatar}
            >
              حذف تصویر
            </Button>
          )}

          {message && <p className="mt-2 text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-destructive mt-2 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h3l1.5-2h7L17 7h3a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="12" cy="13" r="3.5" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}
