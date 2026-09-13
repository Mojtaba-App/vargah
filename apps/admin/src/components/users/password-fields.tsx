'use client';

import { useMemo, useState } from 'react';
import { evaluatePasswordStrength, generateSecurePassword } from '@vargah/security/password-strength';
import { Input, Label } from '@vargah/ui/components/input';
import { Button } from '@vargah/ui/components/button';
import { FieldMessage } from '@/components/ui/form/field-message';
import { cn } from '@/lib/utils';

type PasswordFieldsProps = {
  id?: string;
  name?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
  onConfirmBlur?: () => void;
  email?: string | null;
  disabled?: boolean;
  showGenerator?: boolean;
  required?: boolean;
  error?: string;
  confirmError?: string;
};

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

export function PasswordFields({
  id = 'password',
  name = 'password',
  label = 'رمز عبور',
  value,
  onChange,
  onBlur,
  confirmValue = '',
  onConfirmChange,
  onConfirmBlur,
  email,
  disabled,
  showGenerator = true,
  required = true,
  error,
  confirmError,
}: PasswordFieldsProps) {
  const [lastGenerated, setLastGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const strength = useMemo(() => evaluatePasswordStrength(value, { email }), [value, email]);

  const handleGenerate = () => {
    const generated = generateSecurePassword(14);
    onChange(generated);
    onConfirmChange?.(generated);
    setLastGenerated(generated);
    setCopied(false);
  };

  const handleCopyGenerated = async () => {
    if (!lastGenerated) return;
    try {
      await navigator.clipboard.writeText(lastGenerated);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const showGeneratedBanner = lastGenerated !== null && value === lastGenerated;

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
          {showGenerator && (
            <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={disabled}>
              تولید رمز امن
            </Button>
          )}
        </div>

        {showGeneratedBanner && (
          <div className="mb-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs font-medium text-primary">رمز تولید‌شده</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="min-w-0 flex-1 truncate font-mono text-sm text-foreground" dir="ltr">
                {lastGenerated}
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0 rounded-lg"
                onClick={handleCopyGenerated}
                aria-label="کپی رمز عبور"
              >
                <CopyIcon className="size-4" />
                <span className="ms-1.5">{copied ? 'کپی شد' : 'کپی'}</span>
              </Button>
            </div>
          </div>
        )}

        <Input
          id={id}
          name={name}
          type="password"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (lastGenerated && e.target.value !== lastGenerated) {
              setLastGenerated(null);
            }
          }}
          onBlur={onBlur}
          disabled={disabled}
          required={required}
          autoComplete="new-password"
          aria-invalid={Boolean(error)}
          className="rounded-xl"
          dir="ltr"
        />
        <FieldMessage message={error} />

        {value.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
              />
            </div>
            <p className="text-xs font-medium" style={{ color: strength.color }}>
              قدرت رمز: {strength.label}
            </p>
            <ul className="grid gap-1 sm:grid-cols-2">
              {strength.rules.map((rule) => (
                <li
                  key={rule.id}
                  className={cn(
                    'text-xs',
                    rule.passed ? 'text-emerald-600' : 'text-muted-foreground',
                  )}
                >
                  {rule.passed ? '✓' : '○'} {rule.label}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {onConfirmChange && (
        <div>
          <Label htmlFor={`${id}-confirm`} required={required}>
            تأیید رمز عبور
          </Label>
          <Input
            id={`${id}-confirm`}
            name="passwordConfirm"
            type="password"
            value={confirmValue}
            onChange={(e) => onConfirmChange(e.target.value)}
            onBlur={onConfirmBlur}
            disabled={disabled}
            required={required}
            autoComplete="new-password"
            aria-invalid={Boolean(confirmError)}
            className="mt-2 rounded-xl"
            dir="ltr"
          />
          <FieldMessage message={confirmError} />
        </div>
      )}
    </div>
  );
}
