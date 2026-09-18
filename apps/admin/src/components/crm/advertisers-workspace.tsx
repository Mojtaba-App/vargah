'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ColumnDef } from '@tanstack/react-table';
import { AdCampaignStatus, PaymentStatus } from '@vargah/database/enums';
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
import { FieldHint, FieldMessage } from '@/components/ui/form/field-message';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';
import { ProvinceCityField } from '@/components/ui/form/province-city-field';
import { GeoLocationFilterBar, matchesGeoFilter } from '@/components/crm/geo-location-filter';
import {
  createAdvertiser,
  createCampaign,
  deleteAdvertiser,
  deleteCampaign,
  recordCampaignPayment,
  updateAdvertiser,
  updateCampaign,
  updateCampaignStatus,
} from '@/actions/advertisers';
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_STATUS_VARIANT,
  CAMPAIGN_TYPES,
  getCampaignDurationDays,
  getCampaignTypeLabel,
  isCampaignRunning,
  TARIFF_PRESETS,
  type CampaignStatusFilter,
} from '@/lib/crm/advertisers/constants';
import {
  advertiserFormSchema,
  campaignFormSchema,
  type AdvertiserFormValues,
  type CampaignFormValues,
} from '@/lib/schemas/advertiser-form';
import { formatJalali, formatNumber, formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

export type AdvertiserRow = {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  notes: string | null;
  createdAt: Date;
  _count: { campaigns: number; payments: number; tickets: number };
  campaigns: CampaignRow[];
};

export type CampaignRow = {
  id: string;
  advertiserId: string;
  title: string;
  type: string;
  tariff: number;
  startDate: Date;
  endDate: Date;
  status: AdCampaignStatus;
  notes: string | null;
  companyName: string;
  payments: {
    id: string;
    amount: number;
    status: PaymentStatus;
    paidAt: Date | null;
    createdAt: Date;
  }[];
};

type AdvertisersWorkspaceProps = {
  advertisers: AdvertiserRow[];
  canManage: boolean;
};

type Tab = 'advertisers' | 'campaigns';

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number | string;
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
        active && 'border-primary ring-primary/20 ring-1',
      )}
    >
      <p className="text-2xl font-bold tabular-nums">
        {typeof value === 'number' ? formatNumber(value) : value}
      </p>
      <p className="text-muted-foreground mt-1 text-sm">{label}</p>
    </Comp>
  );
}

export function AdvertisersWorkspace({
  advertisers: initialAdvertisers,
  canManage,
}: AdvertisersWorkspaceProps) {
  const router = useRouter();
  const [advertisers, setAdvertisers] = useState(initialAdvertisers);
  const [tab, setTab] = useState<Tab>('advertisers');
  const [statusFilter, setStatusFilter] = useState<CampaignStatusFilter>('ALL');
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<AdvertiserRow | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRow | null>(null);
  const [editingAdvertiser, setEditingAdvertiser] = useState<AdvertiserRow | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<CampaignRow | null>(null);
  const [deleteAdvertiserTarget, setDeleteAdvertiserTarget] = useState<AdvertiserRow | null>(null);
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState<CampaignRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setAdvertisers(initialAdvertisers);
  }, [initialAdvertisers]);

  const allCampaigns = useMemo(
    () =>
      advertisers.flatMap((advertiser) =>
        advertiser.campaigns.map((campaign) => ({
          ...campaign,
          companyName: advertiser.companyName,
        })),
      ),
    [advertisers],
  );

  const stats = useMemo(() => {
    const active = allCampaigns.filter((c) => c.status === AdCampaignStatus.ACTIVE).length;
    const running = allCampaigns.filter((c) =>
      isCampaignRunning(c.status, c.startDate, c.endDate),
    ).length;
    const draft = allCampaigns.filter((c) => c.status === AdCampaignStatus.DRAFT).length;
    const activeTariff = allCampaigns
      .filter((c) => c.status === AdCampaignStatus.ACTIVE)
      .reduce((sum, c) => sum + c.tariff, 0);
    return {
      advertisers: advertisers.length,
      campaigns: allCampaigns.length,
      active,
      running,
      draft,
      activeTariff,
    };
  }, [advertisers, allCampaigns]);

  const filteredAdvertisers = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return advertisers.filter((advertiser) => {
      if (!matchesGeoFilter(advertiser, provinceFilter, cityFilter)) return false;
      if (!q) return true;
      return [
        advertiser.companyName,
        advertiser.contactName,
        advertiser.email,
        advertiser.phone ?? '',
        advertiser.province ?? '',
        advertiser.city ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [advertisers, debouncedSearch, provinceFilter, cityFilter]);

  const filteredCampaigns = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return allCampaigns.filter((campaign) => {
      if (statusFilter !== 'ALL' && campaign.status !== statusFilter) return false;
      if (!q) return true;
      return [campaign.title, campaign.companyName, getCampaignTypeLabel(campaign.type)]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [allCampaigns, statusFilter, debouncedSearch]);

  const advertiserForm = useForm<AdvertiserFormValues>({
    resolver: zodResolver(
      advertiserFormSchema,
    ) as import('react-hook-form').Resolver<AdvertiserFormValues>,
    defaultValues: {
      companyName: '',
      contactName: '',
      email: '',
      phone: '',
      province: '',
      city: '',
      address: '',
      notes: '',
    },
  });

  const campaignForm = useForm<CampaignFormValues>({
    resolver: zodResolver(
      campaignFormSchema,
    ) as import('react-hook-form').Resolver<CampaignFormValues>,
    defaultValues: {
      advertiserId: '',
      title: '',
      type: '',
      tariff: 0,
      startDate: '',
      endDate: '',
      status: AdCampaignStatus.DRAFT,
      notes: '',
    },
  });

  const resetAdvertiserForm = (row?: AdvertiserRow | null) => {
    if (row) {
      advertiserForm.reset({
        companyName: row.companyName,
        contactName: row.contactName,
        email: row.email,
        phone: row.phone ?? '',
        province: row.province ?? '',
        city: row.city ?? '',
        address: row.address ?? '',
        notes: row.notes ?? '',
      });
      setEditingAdvertiser(row);
      setSelectedAdvertiser(row);
    } else {
      advertiserForm.reset({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        province: '',
        city: '',
        address: '',
        notes: '',
      });
      setEditingAdvertiser(null);
    }
    setTab('advertisers');
    setError(null);
  };

  const resetCampaignForm = (row?: CampaignRow | null, advertiserId?: string) => {
    if (row) {
      campaignForm.reset({
        advertiserId: row.advertiserId,
        title: row.title,
        type: row.type,
        tariff: row.tariff,
        startDate: row.startDate.toISOString(),
        endDate: row.endDate.toISOString(),
        status: row.status,
        notes: row.notes ?? '',
      });
      setEditingCampaign(row);
      setSelectedCampaign(row);
    } else {
      campaignForm.reset({
        advertiserId: advertiserId ?? '',
        title: '',
        type: '',
        tariff: 0,
        startDate: '',
        endDate: '',
        status: AdCampaignStatus.DRAFT,
        notes: '',
      });
      setEditingCampaign(null);
    }
    setTab('campaigns');
    setError(null);
  };

  const buildAdvertiserFormData = (values: AdvertiserFormValues) => {
    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => formData.set(key, String(val ?? '')));
    return formData;
  };

  const buildCampaignFormData = (values: CampaignFormValues) => {
    const formData = new FormData();
    formData.set('advertiserId', values.advertiserId);
    formData.set('title', values.title);
    formData.set('type', values.type);
    formData.set('tariff', String(values.tariff));
    formData.set('startDate', values.startDate);
    formData.set('endDate', values.endDate);
    formData.set('status', values.status);
    formData.set('notes', values.notes ?? '');
    return formData;
  };

  const submitAdvertiser = advertiserForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (editingAdvertiser) {
          await updateAdvertiser(editingAdvertiser.id, buildAdvertiserFormData(values));
          setMessage('اطلاعات شرکت به‌روزرسانی شد.');
        } else {
          await createAdvertiser(buildAdvertiserFormData(values));
          setMessage('آگهی‌دهنده جدید ثبت شد.');
          resetAdvertiserForm(null);
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  });

  const submitCampaign = campaignForm.handleSubmit((values) => {
    startTransition(async () => {
      try {
        if (editingCampaign) {
          await updateCampaign(editingCampaign.id, buildCampaignFormData(values));
          setMessage('کمپین به‌روزرسانی شد.');
        } else {
          await createCampaign(buildCampaignFormData(values));
          setMessage('کمپین جدید ثبت شد.');
          resetCampaignForm(null);
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

  const advertiserColumns: ColumnDef<AdvertiserRow>[] = [
    {
      accessorKey: 'companyName',
      header: 'شرکت',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-start"
          onClick={() => resetAdvertiserForm(row.original)}
        >
          <p className="font-medium">{row.original.companyName}</p>
          <p className="text-muted-foreground text-xs">{row.original.contactName}</p>
        </button>
      ),
    },
    {
      accessorKey: 'email',
      header: 'ایمیل',
      cell: ({ row }) => <span dir="ltr">{row.original.email}</span>,
    },
    { accessorKey: 'phone', header: 'تلفن', cell: ({ row }) => row.original.phone ?? '—' },
    {
      accessorKey: '_count.campaigns',
      header: 'کمپین',
      cell: ({ row }) => formatNumber(row.original._count.campaigns),
    },
    {
      id: 'active',
      header: 'فعال',
      cell: ({ row }) => {
        const active = row.original.campaigns.find((c) => c.status === AdCampaignStatus.ACTIVE);
        return active ? active.title : '—';
      },
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) =>
        canManage ? (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => resetAdvertiserForm(row.original)}>
              ویرایش
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetCampaignForm(null, row.original.id)}
            >
              + کمپین
            </Button>
          </div>
        ) : null,
    },
  ];

  const campaignColumns: ColumnDef<CampaignRow>[] = [
    {
      accessorKey: 'title',
      header: 'کمپین',
      cell: ({ row }) => (
        <button
          type="button"
          className="text-start"
          onClick={() => resetCampaignForm(row.original)}
        >
          <p className="font-medium">{row.original.title}</p>
          <p className="text-muted-foreground text-xs">{row.original.companyName}</p>
        </button>
      ),
    },
    {
      accessorKey: 'type',
      header: 'نوع',
      cell: ({ row }) => getCampaignTypeLabel(row.original.type),
    },
    {
      accessorKey: 'tariff',
      header: 'تعرفه',
      cell: ({ row }) => `${formatPrice(row.original.tariff)} ت`,
    },
    {
      accessorKey: 'status',
      header: 'وضعیت',
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant={CAMPAIGN_STATUS_VARIANT[row.original.status]}>
            {CAMPAIGN_STATUS_LABELS[row.original.status]}
          </Badge>
          {isCampaignRunning(row.original.status, row.original.startDate, row.original.endDate) && (
            <Badge variant="secondary">در حال اجرا</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'startDate',
      header: 'بازه',
      cell: ({ row }) => (
        <span className="text-xs">
          {formatJalali(row.original.startDate)} — {formatJalali(row.original.endDate)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'عملیات',
      cell: ({ row }) =>
        canManage ? (
          <Button variant="ghost" size="sm" onClick={() => resetCampaignForm(row.original)}>
            ویرایش
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-6">
      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="شرکت‌ها" value={stats.advertisers} />
        <StatCard label="کل کمپین‌ها" value={stats.campaigns} />
        <StatCard
          label="فعال"
          value={stats.active}
          active={statusFilter === AdCampaignStatus.ACTIVE}
          onClick={() => {
            setTab('campaigns');
            setStatusFilter(AdCampaignStatus.ACTIVE);
          }}
        />
        <StatCard
          label="پیش‌نویس"
          value={stats.draft}
          active={statusFilter === AdCampaignStatus.DRAFT}
          onClick={() => {
            setTab('campaigns');
            setStatusFilter(AdCampaignStatus.DRAFT);
          }}
        />
        <StatCard label="ارزش کمپین‌های فعال" value={`${formatPrice(stats.activeTariff)} ت`} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={tab === 'advertisers' ? 'default' : 'outline'}
          className="rounded-xl"
          onClick={() => setTab('advertisers')}
        >
          شرکت‌ها
          <Badge variant="secondary" className="ms-2">
            {advertisers.length}
          </Badge>
        </Button>
        <Button
          type="button"
          variant={tab === 'campaigns' ? 'default' : 'outline'}
          className="rounded-xl"
          onClick={() => setTab('campaigns')}
        >
          کمپین‌ها
          <Badge variant="secondary" className="ms-2">
            {allCampaigns.length}
          </Badge>
        </Button>
        <ExportToolbar
          title={tab === 'campaigns' ? 'گزارش کمپین‌های تبلیغاتی' : 'گزارش آگهی‌دهندگان'}
          subtitle="خروجی مدیریتی CRM تبلیغات"
          filenameBase={tab === 'campaigns' ? 'ad-campaigns-report' : 'advertisers-report'}
          columns={
            tab === 'campaigns'
              ? [
                  { key: 'title', header: 'عنوان', width: 22 },
                  { key: 'company', header: 'شرکت', width: 18 },
                  { key: 'type', header: 'نوع', width: 12 },
                  { key: 'status', header: 'وضعیت', width: 12 },
                  { key: 'tariff', header: 'تعرفه', width: 14 },
                  { key: 'start', header: 'شروع', width: 14 },
                  { key: 'end', header: 'پایان', width: 14 },
                ]
              : [
                  { key: 'company', header: 'شرکت', width: 20 },
                  { key: 'contact', header: 'رابط', width: 16 },
                  { key: 'email', header: 'ایمیل', width: 22 },
                  { key: 'phone', header: 'تلفن', width: 14 },
                  { key: 'location', header: 'موقعیت', width: 18 },
                  { key: 'campaigns', header: 'کمپین', width: 10 },
                ]
          }
          rows={
            tab === 'campaigns'
              ? filteredCampaigns.map((row) => ({
                  title: row.title,
                  company: row.companyName,
                  type: getCampaignTypeLabel(row.type),
                  status: CAMPAIGN_STATUS_LABELS[row.status],
                  tariff: row.tariff,
                  start: formatJalali(row.startDate),
                  end: formatJalali(row.endDate),
                }))
              : filteredAdvertisers.map((row) => ({
                  company: row.companyName,
                  contact: row.contactName,
                  email: row.email,
                  phone: row.phone,
                  location: formatIranLocation(row.province, row.city),
                  campaigns: row._count.campaigns,
                }))
          }
          onDone={setMessage}
          onError={setError}
        />
      </div>

      <SearchInput
        id="advertiser-search"
        placeholder={
          tab === 'advertisers' ? 'جستجوی شرکت، مسئول، ایمیل...' : 'جستجوی کمپین، شرکت، نوع...'
        }
        value={search}
        onChange={setSearch}
      />

      {tab === 'advertisers' && (
        <GeoLocationFilterBar
          province={provinceFilter}
          city={cityFilter}
          onProvinceChange={setProvinceFilter}
          onCityChange={setCityFilter}
          source="advertisers"
        />
      )}

      {tab === 'campaigns' && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              'ALL',
              AdCampaignStatus.ACTIVE,
              AdCampaignStatus.DRAFT,
              AdCampaignStatus.PAUSED,
              AdCampaignStatus.COMPLETED,
              AdCampaignStatus.CANCELLED,
            ] as const
          ).map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={statusFilter === status ? 'default' : 'outline'}
              className="rounded-xl"
              onClick={() => setStatusFilter(status)}
            >
              {status === 'ALL' ? 'همه' : CAMPAIGN_STATUS_LABELS[status]}
            </Button>
          ))}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {canManage && (
          <Card className="rounded-2xl xl:sticky xl:top-4 xl:self-start">
            <CardContent className="space-y-4 pt-6">
              {tab === 'advertisers' ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {editingAdvertiser ? 'ویرایش شرکت' : 'شرکت جدید'}
                    </p>
                    {editingAdvertiser && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => resetAdvertiserForm(null)}
                      >
                        انصراف
                      </Button>
                    )}
                  </div>
                  <form onSubmit={submitAdvertiser} noValidate className="space-y-3">
                    <div>
                      <Label required>نام شرکت</Label>
                      <Input
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...advertiserForm.register('companyName')}
                      />
                      <FieldMessage
                        message={advertiserForm.formState.errors.companyName?.message}
                      />
                    </div>
                    <div>
                      <Label required>مسئول</Label>
                      <Input
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...advertiserForm.register('contactName')}
                      />
                      <FieldMessage
                        message={advertiserForm.formState.errors.contactName?.message}
                      />
                    </div>
                    <div>
                      <Label required>ایمیل</Label>
                      <Input
                        className="mt-2 rounded-xl"
                        dir="ltr"
                        disabled={isPending}
                        {...advertiserForm.register('email')}
                      />
                      <FieldMessage message={advertiserForm.formState.errors.email?.message} />
                    </div>
                    <div>
                      <Label>تلفن</Label>
                      <Input
                        className="mt-2 rounded-xl"
                        dir="ltr"
                        disabled={isPending}
                        {...advertiserForm.register('phone')}
                      />
                    </div>
                    <Controller
                      name="province"
                      control={advertiserForm.control}
                      render={({ field: provinceField }) => (
                        <Controller
                          name="city"
                          control={advertiserForm.control}
                          render={({ field: cityField }) => (
                            <ProvinceCityField
                              province={provinceField.value ?? ''}
                              city={cityField.value ?? ''}
                              onProvinceChange={provinceField.onChange}
                              onCityChange={cityField.onChange}
                              disabled={isPending}
                              provinceError={advertiserForm.formState.errors.province?.message}
                              cityError={advertiserForm.formState.errors.city?.message}
                            />
                          )}
                        />
                      )}
                    />
                    <div>
                      <Label>آدرس (خیابان و پلاک)</Label>
                      <Textarea
                        rows={2}
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...advertiserForm.register('address')}
                      />
                    </div>
                    <div>
                      <Label>یادداشت قرارداد</Label>
                      <Textarea
                        rows={2}
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...advertiserForm.register('notes')}
                      />
                    </div>
                    <LoadingButton type="submit" loading={isPending} className="w-full rounded-xl">
                      {editingAdvertiser ? 'ذخیره شرکت' : 'افزودن شرکت'}
                    </LoadingButton>
                  </form>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {editingCampaign ? 'ویرایش کمپین' : 'کمپین جدید'}
                    </p>
                    {editingCampaign && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => resetCampaignForm(null)}
                      >
                        انصراف
                      </Button>
                    )}
                  </div>
                  <form onSubmit={submitCampaign} noValidate className="space-y-3">
                    <div>
                      <Label required>شرکت</Label>
                      <Select
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...campaignForm.register('advertiserId')}
                      >
                        <option value="">انتخاب شرکت</option>
                        {advertisers.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.companyName}
                          </option>
                        ))}
                      </Select>
                      <FieldMessage message={campaignForm.formState.errors.advertiserId?.message} />
                    </div>
                    <div>
                      <Label required>عنوان کمپین</Label>
                      <Input
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...campaignForm.register('title')}
                      />
                      <FieldMessage message={campaignForm.formState.errors.title?.message} />
                    </div>
                    <div>
                      <Label required>نوع</Label>
                      <Select
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...campaignForm.register('type')}
                      >
                        <option value="">انتخاب نوع</option>
                        {CAMPAIGN_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label required>تعرفه (تومان)</Label>
                      <Input
                        type="number"
                        min={0}
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...campaignForm.register('tariff')}
                      />
                      <div className="mt-2 flex flex-wrap gap-1">
                        {TARIFF_PRESETS.map((preset) => (
                          <Button
                            key={preset.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="rounded-lg text-xs"
                            disabled={isPending}
                            onClick={() =>
                              campaignForm.setValue('tariff', preset.value, { shouldDirty: true })
                            }
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                      <FieldMessage message={campaignForm.formState.errors.tariff?.message} />
                    </div>
                    <Controller
                      name="startDate"
                      control={campaignForm.control}
                      render={({ field }) => (
                        <JalaliDateTimeField
                          id="campaign-start"
                          label="شروع کمپین"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          disabled={isPending}
                        />
                      )}
                    />
                    <Controller
                      name="endDate"
                      control={campaignForm.control}
                      render={({ field }) => (
                        <JalaliDateTimeField
                          id="campaign-end"
                          label="پایان کمپین"
                          value={field.value ?? ''}
                          onChange={field.onChange}
                          disabled={isPending}
                          hint="باید بعد از تاریخ شروع باشد"
                        />
                      )}
                    />
                    <FieldMessage message={campaignForm.formState.errors.endDate?.message} />
                    <div>
                      <Label>وضعیت</Label>
                      <Select
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...campaignForm.register('status')}
                      >
                        {Object.entries(CAMPAIGN_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label>یادداشت</Label>
                      <Textarea
                        rows={2}
                        className="mt-2 rounded-xl"
                        disabled={isPending}
                        {...campaignForm.register('notes')}
                      />
                    </div>
                    <LoadingButton type="submit" loading={isPending} className="w-full rounded-xl">
                      {editingCampaign ? 'ذخیره کمپین' : 'افزودن کمپین'}
                    </LoadingButton>
                  </form>
                </>
              )}
            </CardContent>
          </Card>
        )}

        <div className={cn('space-y-4', canManage ? 'xl:col-span-2' : 'xl:col-span-3')}>
          {tab === 'advertisers' ? (
            <>
              <DataTable
                columns={advertiserColumns}
                data={filteredAdvertisers}
                showSearch={false}
              />
              {selectedAdvertiser && (
                <Card className="rounded-2xl">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{selectedAdvertiser.companyName}</p>
                        <p className="text-muted-foreground text-sm">
                          {selectedAdvertiser.contactName}
                        </p>
                      </div>
                      {canManage && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => resetCampaignForm(null, selectedAdvertiser.id)}
                          >
                            کمپین جدید
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => setDeleteAdvertiserTarget(selectedAdvertiser)}
                          >
                            حذف
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">ایمیل</p>
                        <p dir="ltr">{selectedAdvertiser.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تلفن</p>
                        <p dir="ltr">{selectedAdvertiser.phone ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">موقعیت</p>
                        <p>
                          {formatIranLocation(
                            selectedAdvertiser.province,
                            selectedAdvertiser.city,
                          ) ?? '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">کمپین‌ها</p>
                        <p>{formatNumber(selectedAdvertiser._count.campaigns)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">پرداخت‌ها</p>
                        <p>{formatNumber(selectedAdvertiser._count.payments)}</p>
                      </div>
                    </div>
                    {selectedAdvertiser.address && (
                      <p className="bg-muted/40 rounded-xl p-3 text-sm">
                        <span className="text-muted-foreground">آدرس: </span>
                        {selectedAdvertiser.address}
                      </p>
                    )}
                    {selectedAdvertiser.notes && (
                      <p className="bg-muted/40 rounded-xl p-3 text-sm">
                        {selectedAdvertiser.notes}
                      </p>
                    )}
                    {selectedAdvertiser.campaigns.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium">کمپین‌های این شرکت</p>
                        <ul className="space-y-2">
                          {selectedAdvertiser.campaigns.map((c) => (
                            <li
                              key={c.id}
                              className="bg-muted/40 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm"
                            >
                              <button
                                type="button"
                                className="text-start hover:underline"
                                onClick={() => resetCampaignForm(c)}
                              >
                                {c.title}
                              </button>
                              <div className="flex items-center gap-2">
                                <Badge variant={CAMPAIGN_STATUS_VARIANT[c.status]}>
                                  {CAMPAIGN_STATUS_LABELS[c.status]}
                                </Badge>
                                <span>{formatPrice(c.tariff)} ت</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <>
              <DataTable columns={campaignColumns} data={filteredCampaigns} showSearch={false} />
              {selectedCampaign && (
                <Card className="rounded-2xl">
                  <CardContent className="space-y-4 pt-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold">{selectedCampaign.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {selectedCampaign.companyName}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant={CAMPAIGN_STATUS_VARIANT[selectedCampaign.status]}>
                            {CAMPAIGN_STATUS_LABELS[selectedCampaign.status]}
                          </Badge>
                          {isCampaignRunning(
                            selectedCampaign.status,
                            selectedCampaign.startDate,
                            selectedCampaign.endDate,
                          ) && <Badge variant="secondary">در حال اجرا</Badge>}
                        </div>
                      </div>
                      {canManage && (
                        <div className="flex flex-wrap gap-2">
                          {selectedCampaign.status === AdCampaignStatus.DRAFT && (
                            <Button
                              size="sm"
                              className="rounded-xl"
                              disabled={isPending}
                              onClick={() =>
                                runAction(
                                  () =>
                                    updateCampaignStatus(
                                      selectedCampaign.id,
                                      AdCampaignStatus.ACTIVE,
                                    ),
                                  'کمپین فعال شد.',
                                )
                              }
                            >
                              فعال‌سازی
                            </Button>
                          )}
                          {selectedCampaign.status === AdCampaignStatus.ACTIVE && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-xl"
                              disabled={isPending}
                              onClick={() =>
                                runAction(
                                  () =>
                                    updateCampaignStatus(
                                      selectedCampaign.id,
                                      AdCampaignStatus.PAUSED,
                                    ),
                                  'کمپین متوقف شد.',
                                )
                              }
                            >
                              توقف
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-xl"
                            disabled={isPending}
                            onClick={() =>
                              runAction(
                                () =>
                                  recordCampaignPayment(
                                    selectedCampaign.id,
                                    selectedCampaign.tariff,
                                  ),
                                'پرداخت ثبت شد.',
                              )
                            }
                          >
                            ثبت پرداخت
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="rounded-xl"
                            onClick={() => setDeleteCampaignTarget(selectedCampaign)}
                          >
                            حذف
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-muted-foreground">نوع</p>
                        <p>{getCampaignTypeLabel(selectedCampaign.type)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">تعرفه</p>
                        <p>{formatPrice(selectedCampaign.tariff)} تومان</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">مدت</p>
                        <p>
                          {formatNumber(
                            getCampaignDurationDays(
                              selectedCampaign.startDate,
                              selectedCampaign.endDate,
                            ),
                          )}{' '}
                          روز
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">شروع</p>
                        <p>{formatJalali(selectedCampaign.startDate, true)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">پایان</p>
                        <p>{formatJalali(selectedCampaign.endDate, true)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href="/finance" className="text-primary text-sm hover:underline">
                        مشاهده مالی
                      </Link>
                    </div>
                    {selectedCampaign.payments.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-medium">پرداخت‌ها</p>
                        <ul className="space-y-1 text-sm">
                          {selectedCampaign.payments.map((p) => (
                            <li
                              key={p.id}
                              className="bg-muted/40 flex justify-between rounded-lg px-3 py-2"
                            >
                              <span>{formatPrice(p.amount)} ت</span>
                              <span className="text-muted-foreground">
                                {p.paidAt ? formatJalali(p.paidAt) : formatJalali(p.createdAt)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteAdvertiserTarget)}
        title="حذف آگهی‌دهنده"
        description={`آیا از حذف «${deleteAdvertiserTarget?.companyName}» و تمام کمپین‌هایش مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={() => {
          if (!deleteAdvertiserTarget) return;
          startTransition(async () => {
            try {
              await deleteAdvertiser(deleteAdvertiserTarget.id);
              setDeleteAdvertiserTarget(null);
              setSelectedAdvertiser(null);
              resetAdvertiserForm(null);
              setMessage('آگهی‌دهنده حذف شد.');
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
              setDeleteAdvertiserTarget(null);
            }
          });
        }}
        onCancel={() => setDeleteAdvertiserTarget(null)}
      />
      <ConfirmDialog
        open={Boolean(deleteCampaignTarget)}
        title="حذف کمپین"
        description={`آیا از حذف «${deleteCampaignTarget?.title}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={isPending}
        onConfirm={() => {
          if (!deleteCampaignTarget) return;
          startTransition(async () => {
            try {
              await deleteCampaign(deleteCampaignTarget.id);
              setDeleteCampaignTarget(null);
              setSelectedCampaign(null);
              resetCampaignForm(null);
              setMessage('کمپین حذف شد.');
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
              setDeleteCampaignTarget(null);
            }
          });
        }}
        onCancel={() => setDeleteCampaignTarget(null)}
      />
    </div>
  );
}
