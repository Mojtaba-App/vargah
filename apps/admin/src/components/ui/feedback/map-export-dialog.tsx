'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Button } from '@vargah/ui/components/button';

import {
  captureElementPng,
  downloadPdfFromImage,
  downloadPngFromDataUrl,
  stampFilename,
} from '@/lib/export';
import { cn, formatNumber } from '@/lib/utils';

export type MapExportMeta = {
  entityLabel: string;
  filterLabel: string;
  mapViewLabel: string;
  withCity: number;
  withoutCity: number;
  coveragePercent: number;
  topCityLabel: string | null;
  topCities: Array<{ city: string; province: string; count: number }>;
  provinces: Array<{ province: string; count: number }>;
};

type MetaSectionId = 'summary' | 'coverage' | 'topCities' | 'provinces';

const META_OPTIONS: Array<{ id: MetaSectionId; label: string; hint: string }> = [
  { id: 'summary', label: 'خلاصه منبع و نما', hint: 'نوع داده، فیلتر و نمای نقشه' },
  { id: 'coverage', label: 'پوشش مکانی', hint: 'تعداد با/بدون شهر و درصد پوشش' },
  { id: 'topCities', label: '۱۰ شهر برتر', hint: 'رتبه‌بندی شهرها' },
  { id: 'provinces', label: 'توزیع استانی', hint: '۱۰ استان برتر' },
];

type MapExportDialogProps = {
  open: boolean;
  title?: string;
  subtitle?: string;
  target: HTMLElement | null;
  meta: MapExportMeta;
  onClose: () => void;
  onDone?: (message: string) => void;
  onError?: (message: string) => void;
};

export function MapExportDialog({
  open,
  title = 'خروجی نقشه',
  subtitle,
  target,
  meta,
  onClose,
  onDone,
  onError,
}: MapExportDialogProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [downloading, setDownloading] = useState(false);
  const [sections, setSections] = useState<Record<MetaSectionId, boolean>>({
    summary: true,
    coverage: true,
    topCities: true,
    provinces: true,
  });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const composeRef = useRef<HTMLDivElement>(null);

  const enabledSections = useMemo(
    () => META_OPTIONS.filter((option) => sections[option.id]),
    [sections],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || !target) {
      setPreview(null);
      return;
    }
    start(async () => {
      try {
        const dataUrl = await captureElementPng(target, {
          pixelRatio: 2,
          backgroundColor: '#ffffff',
        });
        setPreview(dataUrl);
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'پیش‌نمایش نقشه ناموفق بود');
        onClose();
      }
    });
  }, [open, target, onClose, onError]);

  const toggleSection = (id: MetaSectionId) => {
    setSections((current) => ({ ...current, [id]: !current[id] }));
  };

  const captureComposition = async () => {
    const node = composeRef.current;
    if (!node) throw new Error('پیش‌نمایش خروجی آماده نیست');
    return captureElementPng(node, { pixelRatio: 2, backgroundColor: '#ffffff' });
  };

  const downloadPng = () => {
    if (!preview) return;
    setDownloading(true);
    start(async () => {
      try {
        const dataUrl = await captureComposition();
        await downloadPngFromDataUrl(dataUrl, stampFilename('geo-map', 'png'));
        onDone?.('تصویر نقشه با اطلاعات انتخاب‌شده دانلود شد.');
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'خروجی PNG ناموفق بود');
      } finally {
        setDownloading(false);
      }
    });
  };

  const downloadPdf = () => {
    if (!preview) return;
    setDownloading(true);
    start(async () => {
      try {
        const dataUrl = await captureComposition();
        await downloadPdfFromImage(dataUrl, {
          title,
          subtitle: subtitle ?? 'خروجی تصویری نقشه GIS',
          filename: stampFilename('geo-map', 'pdf'),
          generatedAt: new Date(),
        });
        onDone?.('PDF نقشه با اطلاعات انتخاب‌شده دانلود شد.');
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'خروجی PDF نقشه ناموفق بود');
      } finally {
        setDownloading(false);
      }
    });
  };

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        'fixed inset-0 z-50 m-auto w-[min(100%-1.5rem,56rem)] rounded-2xl border border-border bg-card p-0 shadow-2xl backdrop:bg-black/50',
      )}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {subtitle ?? 'پیش‌نمایش را بررسی کنید، اطلاعات زیرین را انتخاب کنید و دانلود کنید.'}
        </p>
      </div>

      <div className="grid gap-0 border-b border-border lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="max-h-[58vh] overflow-auto bg-muted/30 p-4">
          {pending && !preview ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              در حال آماده‌سازی پیش‌نمایش...
            </p>
          ) : preview ? (
            <div
              ref={composeRef}
              className="mx-auto w-full max-w-3xl space-y-3 rounded-xl bg-white p-3 text-foreground shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="پیش‌نمایش نقشه"
                className="mx-auto max-h-[40vh] w-auto rounded-lg border border-border"
              />
              {enabledSections.length > 0 ? (
                <div className="space-y-3 border-t border-border pt-3 text-start">
                  {sections.summary ? (
                    <section>
                      <h3 className="text-sm font-bold">خلاصه خروجی</h3>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        {meta.entityLabel} · فیلتر: {meta.filterLabel} · نما: {meta.mapViewLabel}
                        {meta.topCityLabel ? ` · شهر برتر: ${meta.topCityLabel}` : ''}
                      </p>
                    </section>
                  ) : null}
                  {sections.coverage ? (
                    <section className="grid grid-cols-3 gap-2 text-center">
                      <MetaStat label="با شهر" value={meta.withCity} />
                      <MetaStat label="بدون شهر" value={meta.withoutCity} />
                      <MetaStat label="پوشش" value={meta.coveragePercent} suffix="٪" />
                    </section>
                  ) : null}
                  {sections.topCities && meta.topCities.length > 0 ? (
                    <section>
                      <h3 className="text-sm font-bold">۱۰ شهر برتر</h3>
                      <ul className="mt-1.5 space-y-1 text-xs">
                        {meta.topCities.slice(0, 10).map((city, index) => (
                          <li key={`${city.city}-${city.province}`} className="flex justify-between gap-2">
                            <span>
                              {index + 1}. {city.city}
                              <span className="text-muted-foreground"> ({city.province})</span>
                            </span>
                            <span className="tabular-nums">{formatNumber(city.count)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                  {sections.provinces && meta.provinces.length > 0 ? (
                    <section>
                      <h3 className="text-sm font-bold">توزیع استانی (۱۰ مورد اول)</h3>
                      <ul className="mt-1.5 space-y-1 text-xs">
                        {meta.provinces.slice(0, 10).map((row, index) => (
                          <li key={row.province} className="flex justify-between gap-2">
                            <span>
                              {index + 1}. {row.province}
                            </span>
                            <span className="tabular-nums">{formatNumber(row.count)}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  ) : null}
                </div>
              ) : (
                <p className="border-t border-border pt-3 text-center text-xs text-muted-foreground">
                  هیچ بلوک اطلاعاتی انتخاب نشده — فقط خود نقشه خروجی می‌شود.
                </p>
              )}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-muted-foreground">پیش‌نمایش در دسترس نیست.</p>
          )}
        </div>

        <aside className="border-t border-border p-4 lg:border-t-0 lg:border-s">
          <p className="text-sm font-semibold">اطلاعات زیرین فایل</p>
          <p className="mt-1 text-xs text-muted-foreground">
            هر موردی که تیک بزنید همراه نقشه در PNG/PDF چاپ می‌شود.
          </p>
          <ul className="mt-3 space-y-2">
            {META_OPTIONS.map((option) => (
              <li key={option.id}>
                <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-border/70 px-3 py-2 text-sm hover:bg-muted/40">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={sections[option.id]}
                    onChange={() => toggleSection(option.id)}
                  />
                  <span>
                    <span className="font-medium">{option.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{option.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="flex flex-wrap justify-end gap-2 px-5 py-4">
        <Button type="button" variant="outline" className="rounded-xl" onClick={onClose}>
          بستن
        </Button>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl"
          disabled={!preview || pending || downloading}
          onClick={downloadPng}
        >
          دانلود PNG
        </Button>
        <Button
          type="button"
          className="rounded-xl"
          disabled={!preview || pending || downloading}
          onClick={downloadPdf}
        >
          دانلود PDF
        </Button>
      </div>
    </dialog>
  );
}

function MetaStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-2 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums">
        {formatNumber(value)}
        {suffix}
      </p>
    </div>
  );
}
