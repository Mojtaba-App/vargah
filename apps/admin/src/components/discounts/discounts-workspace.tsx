'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DiscountCodeScope, DiscountCodeType } from '@vargah/database/enums';
import type { SubscriptionPlanConfig } from '@vargah/business/subscription-plans';
import { Input, Label, Textarea } from '@vargah/ui/components/input';
import { Badge } from '@vargah/ui/components/badge';
import { Button } from '@vargah/ui/components/button';
import { Card, CardContent } from '@vargah/ui/components/card';

import {
  createDiscountCode,
  deleteDiscountCode,
  toggleDiscountCodeActive,
  updateDiscountCode,
} from '@/actions/discounts';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import { JalaliDateTimeField } from '@/components/ui/form/jalali-datetime-field';
import { cn, formatJalali, formatNumber, formatPrice } from '@/lib/utils';

export type DiscountCodeRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: DiscountCodeType;
  value: number;
  scope: DiscountCodeScope;
  planSlugs: string[];
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  minSubtotal: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  _count: { redemptions: number };
};

type DiscountsWorkspaceProps = {
  codes: DiscountCodeRow[];
  plans: SubscriptionPlanConfig[];
  canManage: boolean;
};

type FormState = {
  id?: string;
  code: string;
  title: string;
  description: string;
  type: DiscountCodeType;
  value: number;
  scope: DiscountCodeScope;
  planSlugs: string[];
  maxUses: string;
  maxUsesPerUser: string;
  minSubtotal: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};

function emptyForm(): FormState {
  return {
    code: '',
    title: '',
    description: '',
    type: DiscountCodeType.PERCENT,
    value: 10,
    scope: DiscountCodeScope.ALL,
    planSlugs: [],
    maxUses: '',
    maxUsesPerUser: '1',
    minSubtotal: '',
    startsAt: '',
    endsAt: '',
    isActive: true,
  };
}

function toIsoValue(date: Date | null): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString();
}

function toNullableIso(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function DiscountsWorkspace({ codes, plans, canManage }: DiscountsWorkspaceProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCodeRow | null>(null);
  const [pending, start] = useTransition();

  const stats = useMemo(() => {
    const active = codes.filter((c) => c.isActive).length;
    const redemptions = codes.reduce((sum, c) => sum + c._count.redemptions, 0);
    return { total: codes.length, active, redemptions };
  }, [codes]);

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const loadRow = (row: DiscountCodeRow) => {
    setEditingId(row.id);
    setForm({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description ?? '',
      type: row.type,
      value: row.value,
      scope: row.scope,
      planSlugs: row.planSlugs,
      maxUses: row.maxUses != null ? String(row.maxUses) : '',
      maxUsesPerUser: row.maxUsesPerUser != null ? String(row.maxUsesPerUser) : '1',
      minSubtotal: row.minSubtotal != null ? String(row.minSubtotal) : '',
      startsAt: toIsoValue(row.startsAt),
      endsAt: toIsoValue(row.endsAt),
      isActive: row.isActive,
    });
  };

  const buildPayload = () => ({
    id: editingId ?? undefined,
    code: form.code,
    title: form.title,
    description: form.description || null,
    type: form.type,
    value: form.value,
    scope: form.scope,
    planSlugs: form.planSlugs,
    maxUses: form.maxUses ? Number(form.maxUses) : null,
    maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : 1,
    minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : null,
    startsAt: toNullableIso(form.startsAt),
    endsAt: toNullableIso(form.endsAt),
    isActive: form.isActive,
  });

  const handleSave = () => {
    setError(null);
    setMessage(null);
    start(async () => {
      try {
        const payload = buildPayload();
        if (editingId) {
          await updateDiscountCode(editingId, payload);
          setMessage('کد تخفیف به‌روزرسانی شد.');
        } else {
          await createDiscountCode(payload);
          setMessage('کد تخفیف جدید ساخته شد.');
          resetForm();
        }
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="کل کدها" value={stats.total} />
        <StatCard label="فعال" value={stats.active} />
        <StatCard label="استفاده‌شده" value={stats.redemptions} />
      </div>

      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="overflow-hidden rounded-2xl border-primary/15 bg-gradient-to-br from-primary/8 via-card to-card">
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">
                  {editingId ? 'ویرایش کد تخفیف' : 'ساخت کد تخفیف جدید'}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  عمومی برای همه محصولات، یا محدود به پلن‌های انتخابی
                </p>
              </div>
              {editingId && (
                <Button type="button" variant="outline" className="rounded-xl" onClick={resetForm}>
                  انصراف از ویرایش
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="discount-code">کد</Label>
                <Input
                  id="discount-code"
                  value={form.code}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="rounded-xl font-mono uppercase"
                  placeholder="WELCOME20"
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-title">عنوان</Label>
                <Input
                  id="discount-title"
                  value={form.title}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="rounded-xl"
                  placeholder="تخفیف خوش‌آمدگویی"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="discount-desc">توضیح (اختیاری)</Label>
                <Textarea
                  id="discount-desc"
                  value={form.description}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="rounded-xl"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>نوع تخفیف</Label>
                <select
                  value={form.type}
                  disabled={!canManage}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, type: e.target.value as DiscountCodeType }))
                  }
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm"
                >
                  <option value={DiscountCodeType.PERCENT}>درصدی</option>
                  <option value={DiscountCodeType.FIXED}>مبلغ ثابت (تومان)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount-value">
                  {form.type === DiscountCodeType.PERCENT ? 'درصد' : 'مبلغ تخفیف'}
                </Label>
                <Input
                  id="discount-value"
                  type="number"
                  min={1}
                  max={form.type === DiscountCodeType.PERCENT ? 100 : undefined}
                  value={form.value}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) || 0 }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>محدوده اعمال</Label>
                <div className="flex flex-wrap gap-2">
                  <ScopeChip
                    active={form.scope === DiscountCodeScope.ALL}
                    disabled={!canManage}
                    onClick={() => setForm((f) => ({ ...f, scope: DiscountCodeScope.ALL, planSlugs: [] }))}
                  >
                    عمومی (همه محصولات)
                  </ScopeChip>
                  <ScopeChip
                    active={form.scope === DiscountCodeScope.SELECTED}
                    disabled={!canManage}
                    onClick={() => setForm((f) => ({ ...f, scope: DiscountCodeScope.SELECTED }))}
                  >
                    محصول / پلن خاص
                  </ScopeChip>
                </div>
              </div>
              {form.scope === DiscountCodeScope.SELECTED && (
                <div className="space-y-2 sm:col-span-2">
                  <Label>پلن‌های مشمول</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {plans.map((plan) => {
                      const checked = form.planSlugs.includes(plan.slug);
                      return (
                        <label
                          key={plan.id}
                          className={cn(
                            'flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm',
                            checked ? 'border-primary/40 bg-primary/5' : 'border-border',
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={!canManage}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                planSlugs: checked
                                  ? f.planSlugs.filter((s) => s !== plan.slug)
                                  : [...f.planSlugs, plan.slug],
                              }))
                            }
                          />
                          <span className="min-w-0 truncate font-medium">{plan.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>سقف کل استفاده</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, maxUses: e.target.value }))}
                  className="rounded-xl"
                  placeholder="نامحدود"
                />
              </div>
              <div className="space-y-2">
                <Label>سقف هر کاربر</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.maxUsesPerUser}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, maxUsesPerUser: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>حداقل مبلغ سبد</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.minSubtotal}
                  disabled={!canManage}
                  onChange={(e) => setForm((f) => ({ ...f, minSubtotal: e.target.value }))}
                  className="rounded-xl"
                  placeholder="اختیاری"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={!canManage}
                    onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  />
                  فعال برای استفاده
                </label>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <JalaliDateTimeField
                  id="discount-starts-at"
                  label="شروع اعتبار"
                  value={form.startsAt}
                  disabled={!canManage}
                  onChange={(iso) => setForm((f) => ({ ...f, startsAt: iso }))}
                  hint="اختیاری — خالی = بدون محدودیت شروع"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <JalaliDateTimeField
                  id="discount-ends-at"
                  label="پایان اعتبار"
                  value={form.endsAt}
                  disabled={!canManage}
                  onChange={(iso) => setForm((f) => ({ ...f, endsAt: iso }))}
                  hint="اختیاری — باید بعد از شروع اعتبار باشد"
                />
              </div>
            </div>

            {canManage && (
              <LoadingButton
                type="button"
                className="rounded-xl"
                loading={pending}
                onClick={handleSave}
              >
                {editingId ? 'ذخیره تغییرات' : 'ایجاد کد تخفیف'}
              </LoadingButton>
            )}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <h3 className="font-semibold">کدهای ثبت‌شده ({formatNumber(codes.length)})</h3>
          {codes.length === 0 ? (
            <Card className="rounded-2xl border-dashed p-8 text-center text-sm text-muted-foreground">
              هنوز کد تخفیفی ساخته نشده است.
            </Card>
          ) : (
            codes.map((row) => (
              <Card key={row.id} className="rounded-2xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold tracking-wide" dir="ltr">
                        {row.code}
                      </p>
                      <Badge variant={row.isActive ? 'success' : 'secondary'}>
                        {row.isActive ? 'فعال' : 'غیرفعال'}
                      </Badge>
                      <Badge variant="outline">
                        {row.type === DiscountCodeType.PERCENT
                          ? `${row.value}٪`
                          : `${formatPrice(row.value)} تومان`}
                      </Badge>
                      <Badge variant="outline">
                        {row.scope === DiscountCodeScope.ALL ? 'عمومی' : 'محصول خاص'}
                      </Badge>
                    </div>
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">
                      استفاده {formatNumber(row.usedCount)}
                      {row.maxUses != null ? ` از ${formatNumber(row.maxUses)}` : ''}
                      {' · '}
                      ثبت {formatJalali(row.createdAt, true)}
                    </p>
                    {(row.startsAt || row.endsAt) && (
                      <p className="text-xs text-muted-foreground">
                        اعتبار:{' '}
                        {row.startsAt ? formatJalali(row.startsAt, true) : 'بدون شروع'}
                        {' تا '}
                        {row.endsAt ? formatJalali(row.endsAt, true) : 'بدون پایان'}
                      </p>
                    )}
                  </div>
                  {canManage && (
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => loadRow(row)}
                      >
                        ویرایش
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => {
                          start(async () => {
                            try {
                              await toggleDiscountCodeActive(row.id, !row.isActive);
                              router.refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'تغییر وضعیت ناموفق بود');
                            }
                          });
                        }}
                      >
                        {row.isActive ? 'غیرفعال' : 'فعال'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="rounded-xl text-destructive"
                        onClick={() => setDeleteTarget(row)}
                      >
                        حذف
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="حذف کد تخفیف"
        description={`آیا از حذف «${deleteTarget?.code}» مطمئن هستید؟`}
        confirmLabel="حذف"
        variant="destructive"
        loading={pending}
        onConfirm={() => {
          if (!deleteTarget) return;
          start(async () => {
            try {
              await deleteDiscountCode(deleteTarget.id);
              setDeleteTarget(null);
              if (editingId === deleteTarget.id) resetForm();
              setMessage('کد تخفیف حذف شد.');
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'حذف ناموفق بود');
              setDeleteTarget(null);
            }
          });
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(value)}</p>
    </div>
  );
}

function ScopeChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}
