'use client';

import { useMemo, useState } from 'react';
import { Button } from '@vargah/ui/components/button';
import { ModalDialog } from '@/components/ui/feedback/modal-dialog';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { MediaUploadZone, type UploadedMedia } from '@/components/content/media-upload-zone';
import { isImageMime } from '@/lib/media/constants';
import { cn } from '@/lib/utils';

export type MediaPickerAsset = {
  id: string;
  url: string;
  alt: string | null;
  mimeType: string;
  originalName: string;
};

type MediaPickerDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (asset: MediaPickerAsset) => void;
  assets: MediaPickerAsset[];
  imagesOnly?: boolean;
  title?: string;
};

export function MediaPickerDialog({
  open,
  onClose,
  onSelect,
  assets,
  imagesOnly = true,
  title = 'انتخاب تصویر',
}: MediaPickerDialogProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [localAssets, setLocalAssets] = useState<MediaPickerAsset[]>([]);

  const allAssets = useMemo(() => {
    const merged = [...localAssets, ...assets];
    const seen = new Set<string>();
    return merged.filter((asset) => {
      if (seen.has(asset.id)) return false;
      seen.add(asset.id);
      return !imagesOnly || isImageMime(asset.mimeType);
    });
  }, [assets, localAssets, imagesOnly]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return allAssets;
    return allAssets.filter(
      (asset) =>
        asset.originalName.toLowerCase().includes(q) ||
        (asset.alt?.toLowerCase().includes(q) ?? false),
    );
  }, [allAssets, debouncedSearch]);

  const handleUploaded = (uploaded: UploadedMedia) => {
    const asset: MediaPickerAsset = {
      id: uploaded.id,
      url: uploaded.url,
      alt: uploaded.alt,
      mimeType: uploaded.mimeType,
      originalName: uploaded.originalName,
    };
    setLocalAssets((prev) => [asset, ...prev]);
    onSelect(asset);
    onClose();
  };

  return (
    <ModalDialog
      open={open}
      title={title}
      description="از کتابخانه انتخاب کنید یا فایل جدید آپلود کنید"
      onClose={onClose}
    >
      <div className="space-y-4">
        <SearchInput
          id="media-picker-search"
          placeholder="جستجو در نام یا alt..."
          value={search}
          onChange={setSearch}
        />

        <MediaUploadZone onUploaded={handleUploaded} />

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  onSelect(asset);
                  onClose();
                }}
                className={cn(
                  'group overflow-hidden rounded-xl border border-border text-start transition-colors hover:border-primary hover:ring-2 hover:ring-primary/20',
                )}
              >
                <div className="aspect-square bg-muted/40">
                  {isImageMime(asset.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.url}
                      alt={asset.alt ?? asset.originalName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-2xl">📄</div>
                  )}
                </div>
                <p className="truncate px-2 py-1.5 text-xs text-muted-foreground group-hover:text-foreground">
                  {asset.originalName}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-muted/40 p-4 text-center text-sm text-muted-foreground">
            {search ? 'نتیجه‌ای یافت نشد' : 'هنوز تصویری در کتابخانه نیست — یک فایل آپلود کنید'}
          </p>
        )}
      </div>
    </ModalDialog>
  );
}
