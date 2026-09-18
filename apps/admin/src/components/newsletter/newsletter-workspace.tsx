'use client';

import Link from 'next/link';
import { useMemo } from 'react';

type Row = {
  id: string;
  email: string;
  status: string;
  source: string | null;
  confirmedAt: string | null;
  unsubscribedAt: string | null;
  unsubscribeToken: string;
  createdAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'فعال',
  PENDING: 'در انتظار',
  UNSUBSCRIBED: 'لغو شده',
};

export function NewsletterWorkspace({
  rows,
  activeCount,
  statusFilter,
}: {
  rows: Row[];
  activeCount: number;
  statusFilter: string;
}) {
  const csv = useMemo(() => {
    const header = 'email,status,source,createdAt\n';
    const body = rows
      .map((r) => `${r.email},${r.status},${r.source ?? ''},${r.createdAt}`)
      .join('\n');
    return header + body;
  }, [rows]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-page.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-sm">
          {[
            { key: 'all', label: 'همه' },
            { key: 'active', label: 'فعال' },
            { key: 'unsubscribed', label: 'لغو شده' },
          ].map((item) => (
            <Link
              key={item.key}
              href={
                item.key === 'all'
                  ? '/messages/newsletter'
                  : `/messages/newsletter?status=${item.key}`
              }
              className={
                statusFilter === item.key || (item.key === 'all' && statusFilter === 'all')
                  ? 'border-primary bg-primary/10 text-primary rounded-xl border px-3 py-1.5'
                  : 'border-border text-muted-foreground rounded-xl border px-3 py-1.5'
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={downloadCsv}
          className="border-border hover:bg-muted rounded-xl border px-3 py-1.5 text-sm"
        >
          خروجی CSV صفحه
        </button>
      </div>

      <p className="text-muted-foreground text-sm">
        اعضای فعال: {activeCount.toLocaleString('fa-IR')} — لغو عضویت عمومی:{' '}
        <code className="bg-muted rounded px-1" dir="ltr">
          /newsletter/unsubscribe?token=…
        </code>
      </p>

      <div className="border-border overflow-x-auto rounded-2xl border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/40 text-start">
            <tr>
              <th className="px-4 py-3 font-medium">ایمیل</th>
              <th className="px-4 py-3 font-medium">وضعیت</th>
              <th className="px-4 py-3 font-medium">منبع</th>
              <th className="px-4 py-3 font-medium">تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                  عضوی یافت نشد
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-border border-t">
                  <td className="px-4 py-3" dir="ltr">
                    {row.email}
                  </td>
                  <td className="px-4 py-3">{STATUS_LABEL[row.status] ?? row.status}</td>
                  <td className="px-4 py-3">{row.source ?? '—'}</td>
                  <td className="px-4 py-3">
                    {new Date(row.createdAt).toLocaleDateString('fa-IR')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
