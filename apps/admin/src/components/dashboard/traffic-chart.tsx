'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { formatTrafficSource } from '@/lib/dashboard-metrics';

const TRAFFIC_COLORS = {
  visitors: '#6366f1',
  pageViews: '#22d3ee',
} as const;

const SOURCE_COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e'] as const;

type TrafficChartProps = {
  data: { date: string; visitors: number; pageViews: number }[];
};

export function TrafficChart({ data }: TrafficChartProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm" dir="ltr">
      <div className="mb-4 flex items-center justify-between gap-2" dir="rtl">
        <h2 className="font-bold">ترافیک هفتگی</h2>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#6366f1]" />
            بازدیدکننده
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#22d3ee]" />
            بازدید صفحه
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={6}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}
          />
          <Bar
            dataKey="visitors"
            fill={TRAFFIC_COLORS.visitors}
            name="بازدیدکننده"
            radius={[8, 8, 0, 0]}
          />
          <Bar
            dataKey="pageViews"
            fill={TRAFFIC_COLORS.pageViews}
            name="بازدید صفحه"
            radius={[8, 8, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

type SourceRow = { source: string; views: number };

export function TrafficSourcesChart({ data }: { data: SourceRow[] }) {
  const chartData = data.map((d) => ({
    name: formatTrafficSource(d.source),
    views: d.views,
  }));

  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h2 className="font-bold">منابع ترافیک</h2>
        <p className="mt-1 text-xs text-muted-foreground">۳۰ روز اخیر</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={88}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
            }}
          />
          <Bar dataKey="views" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
