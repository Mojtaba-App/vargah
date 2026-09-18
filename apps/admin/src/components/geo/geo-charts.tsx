'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { GeoCityGrowth, GeoTrendPoint } from '@/lib/geo/analytics';
import type { GeoCityStat } from '@/lib/geo/stats';
import { formatNumber } from '@/lib/utils';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

const PROVINCE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#f43f5e',
  '#ec4899',
  '#14b8a6',
  '#a855f7',
  '#0ea5e9',
] as const;

export function GeoTrendChart({ data }: { data: GeoTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <EmptyChart
        title="روند عضویت"
        hint="پس از اجرای تجمیع شبانه، نمودار روند نمایش داده می‌شود."
      />
    );
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h3 className="font-bold">روند عضویت جغرافیایی</h3>
        <p className="text-muted-foreground mt-1 text-xs">
          عضویت جدید و فعال — بر اساس تجمیع روزانه
        </p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={(v) => [formatNumber(Number(v)), '']} />
          <Legend wrapperStyle={{ direction: 'rtl', fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="newSubscribers"
            name="عضویت جدید"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="activeSubscribers"
            name="فعال (تجمیعی)"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </section>
  );
}

export function GeoProvinceShareChart({
  data,
}: {
  data: Array<{ province: string; count: number }>;
}) {
  const slices = data.slice(0, 10);
  if (slices.length === 0) {
    return <EmptyChart title="سهم استان‌ها" hint="داده استانی موجود نیست." />;
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h3 className="font-bold">سهم استان‌ها</h3>
        <p className="text-muted-foreground mt-1 text-xs">۱۰ استان برتر — مشترکین دارای موقعیت</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="count"
            nameKey="province"
            cx="50%"
            cy="50%"
            innerRadius={56}
            outerRadius={96}
            paddingAngle={2}
          >
            {slices.map((_, index) => (
              <Cell key={index} fill={PROVINCE_COLORS[index % PROVINCE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, _name, item) => [
              formatNumber(Number(value)),
              (item.payload as { province: string }).province,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}

export function GeoTopCitiesChart({ cities }: { cities: GeoCityStat[] }) {
  const chartData = cities.slice(0, 10).map((city) => ({
    label: city.city,
    count: city.count,
    full: `${city.city} (${city.province})`,
  }));

  if (chartData.length === 0) {
    return <EmptyChart title="۱۰ شهر برتر" hint="هنوز داده شهری ثبت نشده است." />;
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h3 className="font-bold">۱۰ شهر برتر</h3>
        <p className="text-muted-foreground mt-1 text-xs">تعداد مشترک به تفکیک شهر</p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={88}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value)), 'مشترک']}
            labelFormatter={(_label, payload) =>
              (payload?.[0]?.payload as { full: string } | undefined)?.full ?? ''
            }
          />
          <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

export function GeoGrowthCitiesChart({ cities }: { cities: GeoCityGrowth[] }) {
  const chartData = cities.slice(0, 8).map((city) => ({
    label: city.city,
    growth: city.growth,
    full: `${city.city} (${city.province})`,
  }));

  if (chartData.length === 0) {
    return (
      <EmptyChart
        title="رشد ۳۰ روزه شهرها"
        hint="پس از تجمیع روزانه، شهرهای با بیشترین رشد نمایش داده می‌شوند."
      />
    );
  }

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h3 className="font-bold">رشد ۳۰ روزه شهرها</h3>
        <p className="text-muted-foreground mt-1 text-xs">عضویت جدید در ۳۰ روز اخیر</p>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [formatNumber(Number(value)), 'عضویت جدید']}
            labelFormatter={(_label, payload) =>
              (payload?.[0]?.payload as { full: string } | undefined)?.full ?? ''
            }
          />
          <Bar dataKey="growth" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}

function EmptyChart({ title, hint }: { title: string; hint: string }) {
  return (
    <section className="border-border bg-muted/20 flex h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed p-6 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-2 max-w-sm text-sm">{hint}</p>
    </section>
  );
}
