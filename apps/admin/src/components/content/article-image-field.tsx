'use client';

import { useState } from 'react';
import { Button } from '@vargah/ui/components/button';
import { Input, Label } from '@vargah/ui/components/input';
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { MediaPickerDialog, type MediaPickerAsset } from '@/components/content/media-picker-dialog';
import { cn } from '@/lib/utils';
import { publicAssetUrl } from '@/lib/articles/constants';

type ArticleImageFieldProps = {
  label: string;
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  error?: string;
  hint?: string;
  aspect?: 'video' | 'square';
  mediaAssets: MediaPickerAsset[];
  allowUrlInput?: boolean;
};

function isPreviewableUrl(url: string) {
  return url.startsWith('/') || /^https?:\/\//i.test(url);
}

export function ArticleImageField({
  label,
  value,
  onChange,
  disabled,
  error,
  hint,
  aspect = 'video',
  mediaAssets,
  allowUrlInput = true,
}: ArticleImageFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label>{label}</Label>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={disabled}
            onClick={() => setPickerOpen(true)}
          >
            {value ? 'تغییر تصویر' : 'انتخاب تصویر'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive rounded-lg"
              disabled={disabled}
              onClick={() => onChange('')}
            >
              حذف
            </Button>
          )}
          {allowUrlInput && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-lg"
              disabled={disabled}
              onClick={() => setShowUrl((v) => !v)}
            >
              {showUrl ? 'پنهان URL' : 'لینک مستقیم'}
            </Button>
          )}
        </div>
      </div>

      {value && isPreviewableUrl(value) ? (
        <div className="border-border overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicAssetUrl(value)}
            alt="پیش‌نمایش"
            className={cn(
              'w-full object-cover',
              aspect === 'video' ? 'aspect-video' : 'aspect-square max-w-xs',
            )}
          />
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setPickerOpen(true)}
          className={cn(
            'border-border bg-muted/20 hover:border-primary/50 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors',
            aspect === 'video' ? 'aspect-video' : 'aspect-square max-w-xs',
            disabled && 'pointer-events-none opacity-60',
          )}
        >
          <span className="text-3xl" aria-hidden>
            ＋
          </span>
          <span className="text-foreground text-sm font-medium">انتخاب یا آپلود تصویر کاور</span>
          <span className="text-muted-foreground text-xs">JPG، PNG، WebP یا GIF — نسبت ۱۶:۹</span>
        </button>
      )}

      {showUrl && allowUrlInput && (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/uploads/media/... یا https://..."
          dir="ltr"
          disabled={disabled}
          className="rounded-xl text-sm"
          aria-invalid={Boolean(error)}
        />
      )}

      <FieldMessage message={error} />
      {hint && <FieldHint>{hint}</FieldHint>}

      <MediaPickerDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(asset) => onChange(asset.url)}
        assets={mediaAssets}
      />
    </div>
  );
}
