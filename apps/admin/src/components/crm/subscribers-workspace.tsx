'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { PaymentStatus, SubscriptionStatus } from '@vargah/database/enums';
import { formatIranLocation } from '@vargah/business/iran-locations';
import { Input, Label, Textarea, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';
import { DataTable } from '@/components/ui/data-table';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { ExportToolbar } from '@/components/ui/feedback/export-toolbar';
import { FieldMessage } from '@/components/ui/form/field-message';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';
import { ProvinceCityField } from '@/components/ui/form/province-city-field';
import { GeoLocationFilterBar, matchesGeoFilter } from '@/components/crm/geo-location-filter';
import {
  activateSubscriber,
  cancelSubscriber,
  createSubscriber,
  deleteSubscriber,
  extendSubscriber,
  updateSubscriber,
} from '@/actions/subscribers';
import { getPlanLabelFromList, type SubscriptionPlanConfig } from '@vargah/business/subscription-plans';
import {
  getExpiryHint,
  isExpiringSoon,
  SUBSCRIPTION_STATUS_LABELS,
  SUBSCRIPTION_STATUS_VARIANT,
  type StatusFilter,
} from '@/lib/crm/subscribers/constants';
import { subscriberFormSchema, type SubscriberFormValues } from '@/lib/schemas/subscriber-form';
import { formatJalali, formatNumber, formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type PaymentRow = {
  id: string;
  amount: number;
  status: PaymentStatus;
  description: string | null;
  paidAt: Date | null;
  createdAt: Date;
};

export type SubscriberRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  status: SubscriptionStatus;
  planType: string | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { payments: number; tickets: number };
  payments: PaymentRow[];
};

type SubscribersWorkspaceProps = {
  subscribers: SubscriberRow[];
  subscriptionPlans: SubscriptionPlanConfig[];
  canManage: boolean;
  /** آمار سراسری از سرور (نه صفحهٔ جاری) */
  stats?: {
    total: number;
    active: number;
    expired: number;
    pending: number;
    cancelled: number;
    expiringSoon: number;
  };
  /** فیلتر و جستجو روی سرور انجام شده */
  serverFiltered?: boolean;
  initialFilters?: {
    q?: string;
    status?: string;
    province?: string;
    city?: string;
  };
};

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: 'در انتظار',
  PAID: 'پرداخت‌شده',
  FAILED: 'ناموفق',
  REFUNDED: 'بازگشت',
};

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'surface-card rounded-2xl p-4 text-start transition-colors',
        onClick && 'hover:border-primary/40',
        active && 'border-primary ring-1 ring-primary/20',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </Comp>
  );
}

function StatusBadge({ status, expiresAt }: { status: SubscriptionStatus; expiresAt: Date | null }) {
  const expiryHint = getExpiryHint(expiresAt);
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={SUBSCRIPTION_STATUS_VARIANT[status]}>{SUBSCRIPTION_STATUS_LABELS[status]}</Badge>
      {status === SubscriptionStatus.ACTIVE && isExpiringSoon(expiresAt) && (
        <Badge variant="secondary">در حال انقضا</Badge>
      )}
      {expiryHint && status === SubscriptionStatus.ACTIVE && (
        <span className="text-xs text-amber-600">{expiryHint}</span>
      )}
    </div>
  );
}

function buildFilterHref(next: {
  q?: string;
  status?: string;
  province?: string;
  city?: string;
}) {
  const params = new URLSearchParams();
  if (next.q?.trim()) params.set('q', next.q.trim());
  if (next.status && next.status !== 'ALL') params.set('status', next.status);
  if (next.province?.trim()) params.set('province', next.province.trim());
  if (next.city?.trim()) params.set('city', next.city.trim());
  const qs = params.toString();
  return qs ? `/crm/subscribers?${qs}` : '/crm/subscribers';
}

export function SubscribersWorkspace({
  subscribers: initialSubscribers,
  subscriptionPlans,
  canManage,
  stats: serverStats,
  serverFiltered = false,
  initialFilters,
}: SubscribersWorkspaceProps) {
  const planLabel = (slug: string | null | undefined) =>
    getPlanLabelFromList(subscriptionPlans, slug);
  const planOptions = subscriptionPlans.map((plan) => ({
    value: plan.slug,
    label: plan.name,
  }));
  const router = useRouter();
  const [subscribers, setSubscribers] = useState(initialSubscribers);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (initialFilters?.status as StatusFilter) || 'ALL',
  );
  const [search, setSearch] = useState(initialFilters?.q ?? '');
  const [provinceFilter, setProvinceFilter] = useState(initialFilters?.province ?? '');
  const [cityFilter, setCityFilter] = useState(initialFilters?.city ?? '');
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState<SubscriberRow | null>(null);
  const [editing, setEditing] = useState<SubscriberRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SubscriberRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSubscribers(initialSubscribers);
  }, [initialSubscribers]);

  useEffect(() => {
    if (!serverFiltered) return;
    setStatusFilter((initialFilters?.status as StatusFilter) || 'ALL');
    setSearch(initialFilters?.q ?? '');
    setProvinceFilter(initialFilters?.province ?? '');
    setCityFilter(initialFilters?.city ?? '');
  }, [serverFiltered, initialFilters?.q, initialFilters?.status, initialFilters?.province, initialFilters?.city]);

  useEffect(() => {
    if (!serverFiltered) return;
    const next = buildFilterHref({
      q: debouncedSearch,
      status: statusFilter,
      province: provinceFilter,
      city: cityFilter,
    });
    const current = buildFilterHref({
      q: initialFilters?.q,
      status: initialFilters?.status || 'ALL',
      province: initialFilters?.province,
      city: initialFilters?.city,
    });
    if (next !== current) {
      router.push(next);
    }
  }, [
    serverFiltered,
    debouncedSearch,
    statusFilter,
    provinceFilter,
    cityFilter,
    router,
    initialFilters?.q,
    initialFilters?.status,
    initialFilters?.province,
    initialFilters?.city,
  ]);

  const stats = useMemo(() => {
    if (serverStats) return serverStats;
    const expiringSoon = subscribers.filter(
      (s) => s.status === SubscriptionStatus.ACTIVE && isExpiringSoon(s.expiresAt),
    ).length;
    return {
      total: subscribers.length,
      active: subscribers.filter((s) => s.status === SubscriptionStatus.ACTIVE).length,
      expired: subscribers.filter((s) => s.status === SubscriptionStatus.EXPIRED).length,
      pending: subscribers.filter((s) => s.status === SubscriptionStatus.PENDING_PAYMENT).length,
      cancelled: subscribers.filter((s) => s.status === SubscriptionStatus.CANCELLED).length,
      expiringSoon,
    };
  }, [subscribers, serverStats]);

  const filtered = useMemo(() => {
    if (serverFiltered) return subscribers;
    const q = debouncedSearch.trim().toLowerCase();
    return subscribers.filter((subscriber) => {
      if (statusFilter === 'EXPIRING_SOON') {
        if (!(subscriber.status === SubscriptionStatus.ACTIVE && isExpiringSoon(subscriber.expiresAt))) {
          return false;
        }
      } else if (statusFilter !== 'ALL' && subscriber.status !== statusFilter) {
        return false;
      }

      if (!matchesGeoFilter(subscriber, provinceFilter, cityFilter)) return false;

      if (!q) return true;
      const haystack = [
        subscriber.name,
        subscriber.email,
        subscriber.phone ?? '',
        subscriber.province ?? '',
        subscriber.city ?? '',
        subscriber.planType ?? '',
        planLabel(subscriber.planType),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [subscribers, statusFilter, debouncedSearch, provinceFilter, cityFilter, subscriptionPlans, serverFiltered]);

  const form = useForm<SubscriberFormValues>({
    resolver: zodResolver(subscriberFormSchema) as import('react-hook-form').Resolver<SubscriberFormValues>,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      province: '',
      city: '',
      address: '',
      status: SubscriptionStatus.PENDING_PAYMENT,
      planType: '',
      expiresAt: '',
    },
  });

  const resetForm = (row?: SubscriberRow | null) => {
    if (row) {
      form.reset({
        name: row.name,
        email: row.email,
        phone: row.phone ?? '',
        province: row.province ?? '',
        city: row.city ?? '',
        address: row.address ?? '',
        status: row.status,
        planType: row.planType ?? '',
        expiresAt: row.expiresAt?.toISOString() ?? '',
      });
      setEditing(row);
      setSelected(row);
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        province: '',
        city: '',
        address: '',
        status: SubscriptionStatus.PENDING_PAYMENT,
        planType: '',
        expiresAt: '',
      });
      setEditing(null);
    }
    setError(null);
    setMessage(null);
  };

  const buildFormData = (values: SubscriberFormValues) => {
    const formData = new FormData();
    formData.set('name', values.name);
    formData.set('email', values.email);
    formData.set('phone', values.phone ?? '');
    formData.set('province', values.province ?? '');
    formData.set('city', values.city ?? '');
    formData.set('address', values.address ?? '');
    formData.set('status', values.status);
    formData.set('planType', values.planType ?? '');
    formData.set('expiresAt', values.expiresAt ?? '');
    return formData;
  };

  const submitForm = form.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (editing) {
          await updateSubscriber(editing.id, buildFormData(values));
          setMessage('اطلاعات مشترک به‌روزرسانی شد.');
        } else {
          await createSubscriber(buildFormData(values));
          setMessage('مشترک جدید ثبت شد.');
          resetForm(null);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  });

  const runAction = (action: () => Promise<void>, success: string) => {
    startTransition(async () => {
      try {
        await action();
        setMessage(success);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'عملیات ناموفق بود');
      }
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        await deleteSubscriber(deleteTarget.id);
        setDeleteTarget(null);
        if (selected?.id === deleteTarget.id) {
          setSelected(null);
          resetForm(null);
        }
        setMessage('مشترک حذف شد.');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
        setDeleteTarget(null);
      }
    });
  };

  const columns: ColumnDef<SubscriberRow>[] = [
    {
      accessorKey: 'name',
      header: 'مشترک',
      cell: ({ row }) => (
        <button type="button" className="text-start" onClick={() => { resetForm(row.original); }}>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {row.original.email}
          </p>
        </button>
      ),
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status} expiresAt={row.original.expiresAt} />
      ),
    },
    {
      accessorKey: 'planType',
      header: 'پلن',
      cell: ({ row }) => planLabel(row.original.planType),
    },
    {
      accessorKey: 'expiresAt',
      header: 'انقضا',
      cell: ({ row }) =>
        row.original.expiresAt ? formatJalali(row.original.expiresAt) : '—',
    },
    {
      id: 'payments',
      header: 'پرداخت‌ها',
      cell: ({ row }) => formatNumber(row.original._count.payments),
    },
    {
      id: 'lastPayment',
      header: 'آخرین پرداخت',
      cell: ({ row }) => {
        const payment = row.original.payments[0];
        if (!payment) return '—';
        return `${formatPrice(payment.amount)} ت`;
      },
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) =>
        canManage ? (
          <Button variant="ghost" size="sm" onClick={() => resetForm(row.original)}>
            ویرایش
          </Button>
        ) : null,
    },
  ];

  const showForm = canManage;

  return (
    <div className="space-y-6">
      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="کل مشترکین" value={stats.total} active={statusFilter === 'ALL'} onClick={() => setStatusFilter('ALL')} />
        <StatCard
          label="فعال"
          value={stats.active}
          active={statusFilter === SubscriptionStatus.ACTIVE}
          onClick={() => setStatusFilter(SubscriptionStatus.ACTIVE)}
        />
        <StatCard
          label="منقضی"
          value={stats.expired}
          active={statusFilter === SubscriptionStatus.EXPIRED}
          onClick={() => setStatusFilter(SubscriptionStatus.EXPIRED)}
        />
        <StatCard
          label="در انتظار پرداخت"
          value={stats.pending}
          active={statusFilter === SubscriptionStatus.PENDING_PAYMENT}
          onClick={() => setStatusFilter(SubscriptionStatus.PENDING_PAYMENT)}
        />
        <StatCard
          label="لغوشده"
          value={stats.cancelled}
          active={statusFilter === SubscriptionStatus.CANCELLED}
          onClick={() => setStatusFilter(SubscriptionStatus.CANCELLED)}
        />
        <StatCard
          label="در حال انقضا"
          value={stats.expiringSoon}
          active={statusFilter === 'EXPIRING_SOON'}
          onClick={() => setStatusFilter('EXPIRING_SOON')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          id="subscriber-search"
          placeholder="جستجو در نام، ایمیل، تلفن، پلن..."
          value={search}
          onChange={setSearch}
          aria-label="جستجوی مشترک"
          className="min-w-[16rem] flex-1"
        />
        <ExportToolbar
          title="گزارش مشترکین"
          subtitle="خروجی مدیریتی CRM — مشترکین فیلترشده"
          filenameBase="subscribers-report"
          columns={[
            { key: 'name', header: 'نام', width: 18 },
            { key: 'email', header: 'ایمیل', width: 24 },
            { key: 'phone', header: 'تلفن', width: 14 },
            { key: 'location', header: 'موقعیت', width: 20 },
            { key: 'status', header: 'وضعیت', width: 14 },
            { key: 'plan', header: 'پلن', width: 18 },
            { key: 'expiresAt', header: 'انقضا', width: 16 },
            { key: 'payments', header: 'تعداد پرداخت', width: 12 },
            { key: 'tickets', header: 'تیکت', width: 10 },
          ]}
          rows={filtered.map((row) => ({
            name: row.name,
            email: row.email,
            phone: row.phone,
            location: formatIranLocation(row.province, row.city),
            status: SUBSCRIPTION_STATUS_LABELS[row.status],
            plan: getPlanLabelFromList(subscriptionPlans, row.planType) ?? row.planType,
            expiresAt: row.expiresAt ? formatJalali(row.expiresAt) : '',
            payments: row._count.payments,
            tickets: row._count.tickets,
          }))}
          onDone={setMessage}
          onError={setError}
        />
      </div>

      <GeoLocationFilterBar
        province={provinceFilter}
        city={cityFilter}
        onProvinceChange={setProvinceFilter}
        onCityChange={setCityFilter}
        source="subscribers"
        filter="all"
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {showForm && (
          <Card className="rounded-2xl xl:sticky xl:top-4 xl:self-start">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{editing ? 'ویرایش مشترک' : 'مشترک جدید'}</p>
                {editing && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => resetForm(null)}>
                    انصراف
                  </Button>
                )}
              </div>

              <form onSubmit={submitForm} noValidate className="space-y-3">
                <div>
                  <Label required>نام</Label>
                  <Input className="mt-2 rounded-xl" disabled={isPending} {...form.register('name')} />
                  <FieldMessage message={form.formState.errors.name?.message} />
                </div>
                <div>
                  <Label required>ایمیل</Label>
                  <Input className="mt-2 rounded-xl" dir="ltr" disabled={isPending} {...form.register('email')} />
                  <FieldMessage message={form.formState.errors.email?.message} />
                </div>
                <div>
                  <Label>تلفن</Label>
                  <Input className="mt-2 rounded-xl" dir="ltr" disabled={isPending} {...form.register('phone')} />
                </div>
                <Controller
                  name="province"
                  control={form.control}
                  render={({ field: provinceField }) => (
                    <Controller
                      name="city"
                      control={form.control}
                      render={({ field: cityField }) => (
                        <ProvinceCityField
                          province={provinceField.value ?? ''}
                          city={cityField.value ?? ''}
                          onProvinceChange={provinceField.onChange}
                          onCityChange={cityField.onChange}
                          disabled={isPending}
                          provinceError={form.formState.errors.province?.message}
                          cityError={form.formState.errors.city?.message}
                        />
                      )}
                    />
                  )}
                />
                <div>
                  <Label>آدرس (خیابان و پلاک)</Label>
                  <Textarea rows={2} className="mt-2 rounded-xl" disabled={isPending} {...form.register('address')} />
                </div>
                <div>
                  <Label>پلن</Label>
                  <Select className="mt-2 rounded-xl" disabled={isPending} {...form.register('planType')}>
                    <option value="">انتخاب پلن</option>
                    {planOptions.map((plan) => (
                      <option key={plan.value} value={plan.value}>
                        {plan.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label>وضعیت</Label>
                  <Select className="mt-2 rounded-xl" disabled={isPending} {...form.register('status')}>
                    {Object.entries(SUBSCRIPTION_STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </Select>
                </div>
                <Controller
                  name="expiresAt"
                  control={form.control}
                  render={({ field }) => (
                    <JalaliDateTimeField
                      id="subscriber-expires"
                      label="تاریخ انقضا"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      disabled={isPending}
                      hint="برای اشتراک فعال، تاریخ پایان دسترسی"
                    />
                  )}
                />
                <LoadingButton type="submit" loading={isPending} className="w-full rounded-xl">
                  {editing ? 'ذخیره تغییرات' : 'افزودن مشترک'}
                </LoadingButton>
              </form>
            </CardContent>
          </Card>
        )}

        <div className={cn('space-y-4', showForm ? 'xl:col-span-2' : 'xl:col-span-3')}>
          <DataTable columns={columns} data={filtered} showSearch={false} />

          {selected && (
            <Card className="rounded-2xl">
              <CardContent className="space-y-4 pt-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold">{selected.name}</p>
                    <p className="text-sm text-muted-foreground" dir="ltr">
                      {selected.email}
                    </p>
                    <div className="mt-2">
                      <StatusBadge status={selected.status} expiresAt={selected.expiresAt} />
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {canManage && selected.status === SubscriptionStatus.PENDING_PAYMENT && (
                      <Button
                        size="sm"
                        className="rounded-xl"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => activateSubscriber(selected.id), 'اشتراک فعال شد.')
                        }
                      >
                        تأیید پرداخت
                      </Button>
                    )}
                    {canManage && selected.status !== SubscriptionStatus.CANCELLED && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => extendSubscriber(selected.id), 'اشتراک یک سال تمدید شد.')
                        }
                      >
                        تمدید ۱ سال
                      </Button>
                    )}
                    {canManage && selected.status !== SubscriptionStatus.CANCELLED && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        disabled={isPending}
                        onClick={() =>
                          runAction(() => cancelSubscriber(selected.id), 'اشتراک لغو شد.')
                        }
                      >
                        لغو اشتراک
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-xl"
                        disabled={isPending}
                        onClick={() => setDeleteTarget(selected)}
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">پلن</p>
                    <p className="font-medium">{planLabel(selected.planType)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">انقضا</p>
                    <p className="font-medium">
                      {selected.expiresAt ? formatJalali(selected.expiresAt, true) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">تلفن</p>
                    <p className="font-medium" dir="ltr">
                      {selected.phone ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">موقعیت</p>
                    <p className="font-medium">
                      {formatIranLocation(selected.province, selected.city) ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">عضویت از</p>
                    <p className="font-medium">{formatJalali(selected.createdAt)}</p>
                  </div>
                </div>

                {selected.address && (
                  <p className="rounded-xl bg-muted/40 p-3 text-sm">
                    <span className="text-muted-foreground">آدرس: </span>
                    {selected.address}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-sm">
                  <Badge variant="outline">{formatNumber(selected._count.payments)} پرداخت</Badge>
                  <Badge variant="outline">{formatNumber(selected._count.tickets)} تیکت</Badge>
                  {selected._count.tickets > 0 && (
                    <Link href="/crm/tickets" className="text-primary hover:underline">
                      مشاهده تیکت‌ها
                    </Link>
                  )}
                  <Link href="/finance" className="text-primary hover:underline">
                    مشاهده مالی
                  </Link>
                </div>

                {selected.payments.length > 0 && (
                  <div className="space-y-2">
                    <p className="font-medium">آخرین پرداخت‌ها</p>
                    <ul className="space-y-2">
                      {selected.payments.map((payment) => (
                        <li
                          key={payment.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/40 px-3 py-2 text-sm"
                        >
                          <span>{payment.description ?? 'پرداخت اشتراک'}</span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{PAYMENT_STATUS_LABELS[payment.status]}</Badge>
                            <span className="font-medium">{formatPrice(payment.amount)} ت</span>
                            <span className="text-muted-foreground">
                              {payment.paidAt ? formatJalali(payment.paidAt) : formatJalali(payment.createdAt)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف مشترک"
        description={`آیا از حذف «${deleteTarget?.name}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
