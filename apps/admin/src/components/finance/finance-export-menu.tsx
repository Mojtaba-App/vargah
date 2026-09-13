'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@vargah/ui/components/button';

import { FinanceReportCanvas } from '@/components/finance/finance-report-canvas';
import { captureElementPng, downloadPngFromDataUrl, stampFilename } from '@/lib/export';
import { downloadFinanceReportExcel } from '@/lib/export/finance-report-excel';
import { downloadFinanceReportPdf } from '@/lib/export/finance-report-pdf';
import type { FinanceReportPayload } from '@/lib/finance/report-model';
import { cn } from '@/lib/utils';

type FinanceExportMenuProps = {
  payload: FinanceReportPayload;
  disabled?: boolean;
  onDone?: (message: string) => void;
  onError?: (message: string) => void;
  className?: string;
};

export function FinanceExportMenu({
  payload,
  disabled,
  onDone,
  onError,
  className,
}: FinanceExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, start] = useTransition();
  const canvasHostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const canExport = useMemo(() => !disabled, [disabled]);

  const run = (format: 'xlsx' | 'pdf' | 'png') => {
    if (!canExport) return;
    setOpen(false);
    start(async () => {
      try {
        if (format === 'xlsx') {
          await downloadFinanceReportExcel(payload);
          onDone?.('گزارش مالی Excel آماده شد.');
          return;
        }
        if (format === 'pdf') {
          await downloadFinanceReportPdf(payload);
          onDone?.('گزارش مالی PDF آماده شد.');
          return;
        }

        const host = canvasHostRef.current;
        const node = host?.firstElementChild as HTMLElement | null;
        if (!node) throw new Error('آماده‌سازی تصویر گزارش ناموفق بود');
        const dataUrl = await captureElementPng(node, {
          pixelRatio: 2,
          backgroundColor: '#f8faf9',
        });
        await downloadPngFromDataUrl(dataUrl, stampFilename('finance-report', 'png'));
        onDone?.('تصویر گزارش مالی دانلود شد.');
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'خروجی گزارش مالی ناموفق بود');
      }
    });
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <Button
        type="button"
        size="sm"
        disabled={!canExport || pending}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'rounded-xl border-0 bg-gradient-to-l from-teal-700 to-teal-600 px-3.5 font-semibold text-white shadow-md shadow-teal-900/20',
          'hover:from-teal-800 hover:to-teal-700 hover:text-white',
          'disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none',
          open && 'ring-2 ring-teal-400/60',
        )}
      >
        {pending ? 'در حال آماده‌سازی...' : 'خروجی گزارش جامع'}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />
          <div className="absolute end-0 top-[calc(100%+0.35rem)] z-50 min-w-[14rem] overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">
            <MenuItem
              label="Excel (.xlsx)"
              hint="داشبورد، شماتیک، روند و تراکنش‌ها"
              onClick={() => run('xlsx')}
            />
            <MenuItem
              label="PDF فارسی"
              hint="تحلیل، نمودار میله‌ای و جداول"
              onClick={() => run('pdf')}
            />
            <MenuItem
              label="تصویر (PNG)"
              hint="گزارش بصری برای ارائه"
              onClick={() => run('png')}
            />
          </div>
        </>
      ) : null}

      {mounted
        ? createPortal(
            <div
              ref={canvasHostRef}
              aria-hidden
              className="pointer-events-none fixed top-0"
              style={{ left: -12000, top: 0 }}
            >
              <FinanceReportCanvas payload={payload} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function MenuItem({
  label,
  hint,
  onClick,
}: {
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col rounded-lg px-3 py-2 text-start transition-colors hover:bg-muted"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[11px] text-muted-foreground">{hint}</span>
    </button>
  );
}
