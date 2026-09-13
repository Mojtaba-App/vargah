'use client';

import { useEffect, useMemo, useState } from 'react';
import { Label, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import {
  addJalaliDays,
  formatGregorianDate,
  formatJalaliDateParts,
  getDaysInJalaliMonth,
  getJalaliYearOptions,
  getTodayJalaliParts,
  isIsoAfter,
  isIsoBefore,
  isoToJalaliDateParts,
  jalaliDatePartsToIso,
  JALALI_MONTHS,
  type JalaliDateBoundary,
  type JalaliDateParts,
} from '@/lib/date/jalali';
import { FieldHint } from '@/components/ui/form/field-message';
import { cn } from '@/lib/utils';

type JalaliDateFieldProps = {
  id?: string;
  name?: string;
  label?: string;
  value?: string;
  onChange?: (iso: string) => void;
  disabled?: boolean;
  required?: boolean;
  hint?: string;
  className?: string;
  /** Due dates default to end-of-day so the full Jalali day counts */
  boundary?: JalaliDateBoundary;
  /** متن دکمه فعال‌سازی وقتی تاریخ اختیاری است */
  enableLabel?: string;
  showPresets?: boolean;
  minDate?: string;
  maxDate?: string;
};

const PRESETS: { label: string; offsetDays: number }[] = [
  { label: 'امروز', offsetDays: 0 },
  { label: 'فردا', offsetDays: 1 },
  { label: 'یک هفته', offsetDays: 7 },
  { label: 'دو هفته', offsetDays: 14 },
];

export function JalaliDateField({
  id = 'jalali-date',
  name,
  label = 'مهلت',
  value = '',
  onChange,
  disabled,
  required = false,
  hint,
  className,
  boundary = 'end',
  enableLabel = 'تنظیم تاریخ',
  showPresets = true,
  minDate,
  maxDate,
}: JalaliDateFieldProps) {
  const [parts, setParts] = useState<JalaliDateParts>(
    () => isoToJalaliDateParts(value) ?? getTodayJalaliParts(),
  );
  const [active, setActive] = useState(required || Boolean(value));

  useEffect(() => {
    if (value) {
      const parsed = isoToJalaliDateParts(value);
      if (parsed) {
        setParts(parsed);
        setActive(true);
      }
    } else if (!required) {
      setActive(false);
    }
  }, [value, required]);

  const maxDay = useMemo(() => getDaysInJalaliMonth(parts.year, parts.month), [parts.year, parts.month]);
  const years = useMemo(() => getJalaliYearOptions(parts.year), [parts.year]);

  const emit = (nextParts: JalaliDateParts) => {
    let iso = jalaliDatePartsToIso(nextParts, boundary);
    if (minDate && isIsoBefore(iso, minDate)) {
      const minParts = isoToJalaliDateParts(minDate);
      if (minParts) {
        setParts(minParts);
        iso = jalaliDatePartsToIso(minParts, boundary);
      }
    }
    if (maxDate && isIsoAfter(iso, maxDate)) {
      const maxParts = isoToJalaliDateParts(maxDate);
      if (maxParts) {
        setParts(maxParts);
        iso = jalaliDatePartsToIso(maxParts, boundary);
      }
    }
    onChange?.(iso);
  };

  const applyParts = (next: JalaliDateParts) => {
    const clamped = {
      ...next,
      day: Math.min(next.day, getDaysInJalaliMonth(next.year, next.month)),
    };
    setParts(clamped);
    if (active) emit(clamped);
  };

  const handleEnable = () => {
    const initial = isoToJalaliDateParts(value) ?? getTodayJalaliParts();
    setParts(initial);
    setActive(true);
    emit(initial);
  };

  const handleClear = () => {
    if (required) return;
    setActive(false);
    onChange?.('');
  };

  const isoValue = active ? jalaliDatePartsToIso(parts, boundary) : '';

  return (
    <div className={cn('space-y-2', className)}>
      {name && <input type="hidden" name={name} value={isoValue} required={required && active} />}

      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${id}-year`}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
        {!required && (
          active ? (
            <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={handleClear}>
              پاک کردن
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={handleEnable}>
              {enableLabel}
            </Button>
          )
        )}
      </div>

      {active && (
        <>
          {showPresets && (
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg px-2.5 text-xs"
                  disabled={disabled}
                  onClick={() => applyParts(addJalaliDays(getTodayJalaliParts(), preset.offsetDays))}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            <Select
              id={`${id}-year`}
              disabled={disabled}
              value={parts.year}
              onChange={(e) => applyParts({ ...parts, year: Number(e.target.value) })}
              className="rounded-xl"
              aria-label="سال"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Select>
            <Select
              disabled={disabled}
              value={parts.month}
              onChange={(e) => applyParts({ ...parts, month: Number(e.target.value) })}
              className="rounded-xl"
              aria-label="ماه"
            >
              {JALALI_MONTHS.map((monthName, index) => (
                <option key={monthName} value={index + 1}>
                  {monthName}
                </option>
              ))}
            </Select>
            <Select
              disabled={disabled}
              value={parts.day}
              onChange={(e) => applyParts({ ...parts, day: Number(e.target.value) })}
              className="rounded-xl"
              aria-label="روز"
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            {formatJalaliDateParts(parts)} — معادل میلادی:{' '}
            {formatGregorianDate(isoValue, boundary === 'end')}
            {boundary === 'end' && ' (پایان روز)'}
          </p>

          {(minDate || maxDate) && (
            <FieldHint>
              {minDate && maxDate
                ? 'بازه مجاز بر اساس محدودیت سیستم اعمال می‌شود.'
                : minDate
                  ? 'تاریخ نباید قبل از محدودیت تعیین‌شده باشد.'
                  : 'تاریخ نباید بعد از محدودیت تعیین‌شده باشد.'}
            </FieldHint>
          )}
        </>
      )}

      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}
