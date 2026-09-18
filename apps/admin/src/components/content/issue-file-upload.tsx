'use client';

import { useRef, useState } from 'react';
import { Button } from '@vargah/ui/components/button';
import { Input, Label } from '@vargah/ui/components/input';
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { adminApiPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';
import { cn } from '@/lib/utils';

type IssueFileUploadProps = {
  type: 'pdf' | 'cover';
  issueNumber: number;
  value: string;
  onChange: (path: string) => void;
  disabled?: boolean;
  error?: string;
};

const META = {
  pdf: {
    label: 'فایل PDF شماره',
    accept: 'application/pdf',
    hint: 'حداکثر ۵۰ مگابایت — PDF نسخه دیجیتال شماره',
  },
  cover: {
    label: 'تصویر کاور',
    accept: 'image/jpeg,image/png,image/webp',
    hint: 'حداکثر ۵ مگابایت — JPG, PNG یا WebP',
  },
};

export function IssueFileUpload({
  type,
  issueNumber,
  value,
  onChange,
  disabled,
  error,
}: IssueFileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const meta = META[type];

  const handleUpload = async (file: File) => {
    if (!issueNumber || issueNumber < 1) {
      setUploadError('ابتدا شماره شماره را وارد کنید');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.set('file', file);
      formData.set('type', type);
      formData.set('issueNumber', String(issueNumber));

      const res = await fetch(adminApiPath('/api/issues/upload'), {
        method: 'POST',
        headers: csrfHeaders(),
        body: formData,
        credentials: 'include',
      });

      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        setUploadError(data.error ?? 'آپلود ناموفق بود');
        return;
      }

      onChange(data.path);
    } catch {
      setUploadError('خطا در آپلود فایل');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-border space-y-3 rounded-xl border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{meta.label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'در حال آپلود...' : value ? 'تغییر فایل' : 'انتخاب فایل'}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={meta.accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleUpload(file);
          e.target.value = '';
        }}
      />

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          type === 'pdf' ? '/uploads/issues/12/issue-12.pdf' : '/uploads/issues/12/cover-12.jpg'
        }
        dir="ltr"
        disabled={disabled || uploading}
        aria-invalid={Boolean(error || uploadError)}
        className="rounded-xl text-sm"
      />

      <FieldMessage message={error || uploadError || undefined} />
      <FieldHint>{meta.hint}</FieldHint>

      {type === 'cover' && value && (value.startsWith('/') || value.startsWith('http')) && (
        <div className="border-border overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="پیش‌نمایش کاور"
            className="aspect-[3/4] w-full max-w-xs object-cover"
          />
        </div>
      )}

      {type === 'pdf' && value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className={cn('text-primary inline-flex text-sm hover:underline')}
        >
          مشاهده PDF آپلودشده
        </a>
      )}
    </div>
  );
}
