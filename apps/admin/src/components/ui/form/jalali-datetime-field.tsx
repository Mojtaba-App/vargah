'use client';

import { useEffect, useMemo, useState } from 'react';
import { Input, Label, Select } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import {
  formatGregorianDate,
  formatJalaliParts,
  getDaysInJalaliMonth,
  getJalaliYearOptions,
  isoToJalaliParts,
  jalaliPartsToIso,
  JALALI_MONTHS,
  type JalaliDateTimeParts,
} from '@/lib/date/jalali';
import { FieldHint } from '@/components/ui/form/field-message';
import { cn } from '@/lib/utils';

type JalaliDateTimeFieldProps = {
  id?: string;
  label?: string;
  value?: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
  hint?: string;
  className?: string;
};

const defaultParts = (): JalaliDateTimeParts => {
  const now = isoToJalaliParts(new Date().toISOString());
  return now ?? { year: 1403, month: 1, day: 1, hour: 9, minute: 0 };
};

export function JalaliDateTimeField({
  id = 'jalali-datetime',
  label = 'تاریخ و ساعت',
  value = '',
  onChange,
  disabled,
  hint,
  className,
}: JalaliDateTimeFieldProps) {
  const [parts, setParts] = useState<JalaliDateTimeParts>(() => isoToJalaliParts(value) ?? defaultParts());
  const [active, setActive] = useState(Boolean(value));

  useEffect(() => {
    if (value) {
      const parsed = isoToJalaliParts(value);
      if (parsed) {
        setParts(parsed);
        setActive(true);
      }
    } else {
      setActive(false);
    }
  }, [value]);

  const maxDay = useMemo(() => getDaysInJalaliMonth(parts.year, parts.month), [parts.year, parts.month]);
  const years = useMemo(() => getJalaliYearOptions(parts.year), [parts.year]);

  const applyParts = (next: JalaliDateTimeParts) => {
    const clamped = { ...next, day: Math.min(next.day, getDaysInJalaliMonth(next.year, next.month)) };
    setParts(clamped);
    if (active) onChange(jalaliPartsToIso(clamped));
  };

  const handleEnable = () => {
    setActive(true);
    onChange(jalaliPartsToIso(parts));
  };

  const handleClear = () => {
    setActive(false);
    onChange('');
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={`${id}-year`}>{label}</Label>
        {active ? (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={handleClear}>
            پاک کردن
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={handleEnable}>
            تنظیم تاریخ
          </Button>
        )}
      </div>

      {active && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Select
              id={`${id}-year`}
              disabled={disabled}
              value={parts.year}
              onChange={(e) => applyParts({ ...parts, year: Number(e.target.value) })}
              className="rounded-xl"
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
            >
              {JALALI_MONTHS.map((name, index) => (
                <option key={name} value={index + 1}>
                  {name}
                </option>
              ))}
            </Select>
            <Select
              disabled={disabled}
              value={parts.day}
              onChange={(e) => applyParts({ ...parts, day: Number(e.target.value) })}
              className="rounded-xl"
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </Select>
            <div className="space-y-1">
              <FieldHint className="mb-0">ساعت (۰–۲۳)</FieldHint>
              <Input
                type="number"
                min={0}
                max={23}
                disabled={disabled}
                value={parts.hour}
                onChange={(e) => applyParts({ ...parts, hour: Number(e.target.value) })}
                className="rounded-xl"
                aria-label="ساعت"
              />
            </div>
            <div className="space-y-1">
              <FieldHint className="mb-0">دقیقه (۰–۵۹)</FieldHint>
              <Input
                type="number"
                min={0}
                max={59}
                disabled={disabled}
                value={parts.minute}
                onChange={(e) => applyParts({ ...parts, minute: Number(e.target.value) })}
                className="rounded-xl"
                aria-label="دقیقه"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatJalaliParts(parts)} — معادل میلادی: {formatGregorianDate(jalaliPartsToIso(parts), true)}
          </p>
        </>
      )}

      {hint && <FieldHint>{hint}</FieldHint>}
    </div>
  );
}
