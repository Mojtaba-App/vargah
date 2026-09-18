'use client';

import { useState, useTransition } from 'react';
import { Button } from '@vargah/ui/components/button';

import {
  downloadCsv,
  downloadExcel,
  downloadPdfTable,
  stampFilename,
  type ExportColumn,
  type ExportRow,
} from '@/lib/export';
import { cn } from '@/lib/utils';

type ExportToolbarProps = {
  title: string;
  subtitle?: string;
  filenameBase: string;
  columns: ExportColumn[];
  rows: ExportRow[];
  disabled?: boolean;
  className?: string;
  onDone?: (message: string) => void;
  onError?: (message: string) => void;
};

export function ExportToolbar({
  title,
  subtitle,
  filenameBase,
  columns,
  rows,
  disabled,
  className,
  onDone,
  onError,
}: ExportToolbarProps) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const empty = rows.length === 0;

  const run = (format: 'csv' | 'xlsx' | 'pdf') => {
    if (empty || disabled) return;
    setOpen(false);
    start(async () => {
      try {
        const meta = {
          title,
          subtitle: subtitle ?? `${rows.length.toLocaleString('fa-IR')} ردیف`,
          filename: stampFilename(filenameBase, format === 'xlsx' ? 'xlsx' : format),
          generatedAt: new Date(),
        };
        if (format === 'csv') downloadCsv(columns, rows, meta);
        else if (format === 'xlsx') await downloadExcel(columns, rows, meta);
        else await downloadPdfTable(columns, rows, meta);
        onDone?.(
          format === 'csv'
            ? 'خروجی CSV آماده شد.'
            : format === 'xlsx'
              ? 'خروجی Excel آماده شد.'
              : 'خروجی PDF آماده شد.',
        );
      } catch (error) {
        onError?.(error instanceof Error ? error.message : 'خروجی گزارش ناموفق بود');
      }
    });
  };

  return (
    <div className={cn('relative inline-flex', className)}>
      <Button
        type="button"
        size="sm"
        disabled={disabled || empty || pending}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'rounded-xl border-0 bg-gradient-to-l from-teal-700 to-teal-600 px-3.5 font-semibold text-white shadow-md shadow-teal-900/20',
          'hover:from-teal-800 hover:to-teal-700 hover:text-white',
          'focus-visible:ring-2 focus-visible:ring-teal-500/50',
          'disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none',
          open && 'ring-2 ring-teal-400/60',
        )}
      >
        <span className="inline-flex items-center gap-1.5">
          <ExportIcon className="size-3.5 shrink-0 opacity-95" />
          {pending ? 'در حال آماده‌سازی...' : 'خروجی گزارش'}
        </span>
      </Button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="بستن"
            onClick={() => setOpen(false)}
          />
          <div className="border-border bg-card absolute end-0 top-[calc(100%+0.35rem)] z-50 min-w-[12rem] overflow-hidden rounded-xl border p-1 shadow-xl">
            <ExportItem label="Excel (.xlsx)" hint="جدول مدیریتی" onClick={() => run('xlsx')} />
            <ExportItem label="PDF فارسی" hint="فونت Noto Naskh" onClick={() => run('pdf')} />
            <ExportItem label="CSV" hint="سازگار با اکسل" onClick={() => run('csv')} />
            <p className="border-border text-muted-foreground border-t px-3 py-2 text-[11px]">
              {rows.length.toLocaleString('fa-IR')} ردیف فیلترشده
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function ExportItem({
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
      className="hover:bg-muted flex w-full flex-col rounded-lg px-3 py-2 text-start transition-colors"
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-muted-foreground text-[11px]">{hint}</span>
    </button>
  );
}

function ExportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M5 19h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
