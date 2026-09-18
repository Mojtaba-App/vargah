'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_TYPE_COLORS,
  PAYMENT_TYPE_LABELS,
  PaymentStatus,
  PaymentType,
} from '@/lib/finance/constants';
import { formatNumber, formatPrice } from '@/lib/utils';

const tooltipStyle = {
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  background: '#ffffff',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
};

type TrendPoint = {
  label: string;
  income: number;
  expense: number;
  net: number;
};

type TypeSlice = { type: PaymentType; amount: number; label: string };
type StatusSlice = { status: PaymentStatus; count: number; amount: number; label: string };

function formatTooltipValue(value: number | string | undefined) {
  return `${formatPrice(Number(value ?? 0))} ت`;
}

export function FinanceTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h2 className="font-bold">روند درآمد و هزینه</h2>
        <p className="text-muted-foreground mt-1 text-xs">
          ۶ ماه اخیر — درآمد پرداخت‌شده در برابر بازگشت وجه
        </p>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={data} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            width={56}
            tickFormatter={(v) => formatNumber(Number(v) / 1_000_000) + 'M'}
          />
          <Tooltip
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
            contentStyle={tooltipStyle}
            formatter={(value, name) => [formatTooltipValue(value as number), name]}
          />
          <Legend wrapperStyle={{ direction: 'rtl', fontSize: 12 }} />
          <Bar dataKey="income" name="درآمد" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={36} />
          <Bar
            dataKey="expense"
            name="هزینه (بازگشت)"
            fill="#f43f5e"
            radius={[6, 6, 0, 0]}
            maxBarSize={36}
          />
          <Line
            type="monotone"
            dataKey="net"
            name="خالص"
            stroke="#6366f1"
            strokeWidth={2.5}
            dot={{ r: 3 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  );
}

export function FinanceTypeChart({ data }: { data: TypeSlice[] }) {
  const chartData = data.filter((d) => d.amount > 0);

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h2 className="font-bold">ترکیب درآمد ماه</h2>
        <p className="text-muted-foreground mt-1 text-xs">اشتراک، تبلیغات و سایر</p>
      </div>
      {chartData.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm" dir="rtl">
          درآمدی برای این ماه ثبت نشده
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="amount"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={96}
              paddingAngle={3}
            >
              {chartData.map((entry) => (
                <Cell key={entry.type} fill={PAYMENT_TYPE_COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatTooltipValue(value as number)}
            />
            <Legend wrapperStyle={{ direction: 'rtl', fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export function FinanceStatusChart({ data }: { data: StatusSlice[] }) {
  const chartData = data.filter((d) => d.count > 0);

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm" dir="ltr">
      <div className="mb-4" dir="rtl">
        <h2 className="font-bold">وضعیت پرداخت‌ها</h2>
        <p className="text-muted-foreground mt-1 text-xs">تعداد و حجم بر اساس وضعیت</p>
      </div>
      {chartData.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center text-sm" dir="rtl">
          پرداختی ثبت نشده
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
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
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
              width={88}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => formatTooltipValue(value as number)}
            />
            <Bar dataKey="amount" radius={[0, 8, 8, 0]}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={PAYMENT_STATUS_COLORS[entry.status]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

export function buildTypeChartData(rows: { type: PaymentType; amount: number }[]): TypeSlice[] {
  return rows.map((row) => ({
    ...row,
    label: PAYMENT_TYPE_LABELS[row.type],
  }));
}

export function buildStatusChartData(
  rows: { status: PaymentStatus; count: number; amount: number }[],
): StatusSlice[] {
  return rows.map((row) => ({
    ...row,
    label: PAYMENT_STATUS_LABELS[row.status],
  }));
}
