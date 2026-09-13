'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@vargah/ui/components/button';
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { adminApiPath } from '@/lib/base-path';
import { csrfHeaders } from '@/lib/csrf-client';
import { MEDIA_UPLOAD, isAllowedMediaFile } from '@/lib/media/constants';
import { cn } from '@/lib/utils';

export type UploadedMedia = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
  alt: string | null;
  tags: string[];
  createdAt: string;
};

type MediaUploadZoneProps = {
  onUploaded: (asset: UploadedMedia) => void;
  disabled?: boolean;
  className?: string;
};

type UploadItem = {
  id: string;
  name: string;
  status: 'uploading' | 'done' | 'error';
  error?: string;
};

export function MediaUploadZone({ onUploaded, disabled, className }: MediaUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [queue, setQueue] = useState<UploadItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      const itemId = `${file.name}-${Date.now()}`;
      setQueue((prev) => [...prev, { id: itemId, name: file.name, status: 'uploading' }]);

      try {
        const formData = new FormData();
        formData.set('file', file);

        const res = await fetch(adminApiPath('/api/media/upload'), {
          method: 'POST',
          headers: csrfHeaders(),
          body: formData,
          credentials: 'include',
        });

        const data = (await res.json()) as UploadedMedia & { error?: string };
        if (!res.ok || !data.id) {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === itemId ? { ...item, status: 'error', error: data.error ?? 'آپلود ناموفق' } : item,
            ),
          );
          return;
        }

        setQueue((prev) =>
          prev.map((item) => (item.id === itemId ? { ...item, status: 'done' } : item)),
        );
        onUploaded(data);
      } catch {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === itemId ? { ...item, status: 'error', error: 'خطا در آپلود' } : item,
          ),
        );
      }
    },
    [onUploaded],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      setGlobalError(null);
      const list = Array.from(files);
      if (list.length === 0) return;

      for (const file of list) {
        if (!isAllowedMediaFile(file)) {
          setGlobalError(`فرمت «${file.name}» مجاز نیست`);
          continue;
        }
        if (file.size > MEDIA_UPLOAD.maxSize) {
          setGlobalError(`فایل «${file.name}» بیش از ۲۵ مگابایت است`);
          continue;
        }
        void uploadFile(file);
      }
    },
    [uploadFile],
  );

  const isUploading = queue.some((item) => item.status === 'uploading');

  return (
    <div className={cn('space-y-3', className)}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!disabled) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
          (disabled || isUploading) && 'pointer-events-none opacity-60',
        )}
      >
        <span className="text-3xl">📁</span>
        <p className="font-medium">فایل را بکشید و رها کنید یا کلیک کنید</p>
        <p className="text-xs text-muted-foreground">JPG, PNG, WebP, GIF, PDF — حداکثر ۲۵ مگابایت</p>
        <Button type="button" variant="outline" size="sm" className="mt-2 rounded-xl" disabled={disabled || isUploading}>
          {isUploading ? 'در حال آپلود...' : 'انتخاب فایل'}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MEDIA_UPLOAD.accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <FieldMessage message={globalError ?? undefined} />
      <FieldHint>می‌توانید چند فایل را همزمان آپلود کنید.</FieldHint>

      {queue.length > 0 && (
        <ul className="space-y-1 text-sm">
          {queue.slice(-5).map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <span className="truncate">{item.name}</span>
              <span
                className={cn(
                  'shrink-0 text-xs',
                  item.status === 'done' && 'text-green-600',
                  item.status === 'error' && 'text-destructive',
                  item.status === 'uploading' && 'text-muted-foreground',
                )}
              >
                {item.status === 'uploading' && 'در حال آپلود...'}
                {item.status === 'done' && '✓'}
                {item.status === 'error' && (item.error ?? 'خطا')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
