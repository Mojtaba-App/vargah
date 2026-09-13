'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { DailyLoginPoint } from '@/lib/security/summary';
import { formatNumber } from '@/lib/utils';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

export function LoginTrendChart({ data }: { data: DailyLoginPoint[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h2 className="font-bold">روند تلاش‌های ورود</h2>
        <p className="mt-1 text-xs text-muted-foreground">۱۴ روز اخیر — موفق در برابر ناموفق</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatNumber(Number(value ?? 0)), name]}
          />
          <Legend wrapperStyle={{ direction: 'rtl', fontSize: 12 }} />
          <Bar dataKey="success" name="موفق" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="failed" name="ناموفق" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
