'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@vargah/database/enums';
import { Button } from '@vargah/ui/components/button';
import { Badge } from '@vargah/ui/components/badge';
import { Card, CardContent } from '@vargah/ui/components/card';

import { updateRolePermissions } from '@/actions/users';
import { LoadingButton } from '@/components/ui/feedback/loading-button';
import { StatusBanner } from '@/components/ui/feedback/status-banner';
import {
  ADMIN_ROLES,
  isFullAccessRole,
  PERMISSION_GROUPS,
  PERMISSION_LABELS,
  PERMISSIONS,
  ROLE_LABELS,
  type Permission,
} from '@/lib/permissions';
import { cn } from '@/lib/utils';

const EDITABLE_ROLES: UserRole[] = ADMIN_ROLES;

type PermissionsMatrixEditorProps = {
  initialMatrix: Record<UserRole, Permission[]>;
  canEdit: boolean;
};

export function PermissionsMatrixEditor({ initialMatrix, canEdit }: PermissionsMatrixEditorProps) {
  const router = useRouter();
  const visibleRoles = useMemo(
    () => (canEdit ? EDITABLE_ROLES : EDITABLE_ROLES.filter((role) => !isFullAccessRole(role))),
    [canEdit],
  );
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.EDITOR_IN_CHIEF);
  const [draft, setDraft] = useState<Record<UserRole, Permission[]>>(initialMatrix);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedPermissions = useMemo(() => {
    if (isFullAccessRole(selectedRole)) {
      return new Set(Object.values(PERMISSIONS));
    }
    return new Set(draft[selectedRole] ?? []);
  }, [draft, selectedRole]);

  const togglePermission = (permission: Permission) => {
    if (!canEdit) return;
    if (isFullAccessRole(selectedRole)) return;

    setDraft((prev) => {
      const current = new Set(prev[selectedRole] ?? []);
      if (current.has(permission)) current.delete(permission);
      else current.add(permission);
      return { ...prev, [selectedRole]: Array.from(current) };
    });
  };

  const handleSave = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await updateRolePermissions(selectedRole, draft[selectedRole] ?? []);
        setMessage(`دسترسی‌های نقش «${ROLE_LABELS[selectedRole]}» ذخیره شد.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'ذخیره ناموفق بود');
      }
    });
  };

  const handleResetRole = () => {
    setDraft((prev) => ({
      ...prev,
      [selectedRole]: initialMatrix[selectedRole] ?? [],
    }));
  };

  return (
    <div className="space-y-6">
      {message && <StatusBanner type="success" message={message} />}
      {error && <StatusBanner type="error" message={error} />}

      <div className="flex flex-wrap gap-2">
        {visibleRoles.map((role) => (
          <Button
            key={role}
            type="button"
            variant={selectedRole === role ? 'default' : 'outline'}
            className="rounded-xl"
            onClick={() => setSelectedRole(role)}
          >
            {ROLE_LABELS[role]}
            <Badge variant="secondary" className="ms-2">
              {isFullAccessRole(role)
                ? Object.values(PERMISSIONS).length
                : (draft[role]?.length ?? 0)}
            </Badge>
          </Button>
        ))}
      </div>

      <Card className="rounded-2xl">
        <CardContent className="space-y-6 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">دسترسی‌های {ROLE_LABELS[selectedRole]}</h3>
              <p className="text-muted-foreground text-sm">
                {canEdit
                  ? isFullAccessRole(selectedRole)
                    ? `نقش «${ROLE_LABELS[selectedRole]}» همیشه تمام دسترسی‌ها را دارد.`
                    : 'تغییرات پس از ذخیره برای کاربران با این نقش اعمال می‌شود.'
                  : 'فقط مشاهده — ویرایش ماتریس فقط برای نقش‌های با دسترسی کامل مجاز است.'}
              </p>
            </div>
            {canEdit && !isFullAccessRole(selectedRole) && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={handleResetRole}
                >
                  بازنشانی
                </Button>
                <LoadingButton
                  type="button"
                  loading={isPending}
                  className="rounded-xl"
                  onClick={handleSave}
                >
                  ذخیره نقش
                </LoadingButton>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {PERMISSION_GROUPS.map((group) => (
              <section key={group.label} className="space-y-3">
                <h4 className="text-muted-foreground text-sm font-bold">{group.label}</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {group.permissions.map((permission) => {
                    const checked = selectedPermissions.has(permission);
                    const locked = !canEdit || isFullAccessRole(selectedRole);

                    return (
                      <label
                        key={permission}
                        className={cn(
                          'border-border flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors',
                          checked && 'border-primary/40 bg-primary/5',
                          locked && 'cursor-default opacity-80',
                        )}
                      >
                        <input
                          type="checkbox"
                          className="border-border size-4 rounded"
                          checked={checked}
                          disabled={locked}
                          onChange={() => togglePermission(permission)}
                        />
                        <span className="text-sm">{PERMISSION_LABELS[permission]}</span>
                      </label>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="border-border overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border bg-muted/50 border-b">
              <th className="bg-muted/50 sticky start-0 px-4 py-3 text-start">دسترسی</th>
              {EDITABLE_ROLES.map((role) => (
                <th key={role} className="px-3 py-3 text-center whitespace-nowrap">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(PERMISSION_LABELS).map(([perm, label]) => (
              <tr key={perm} className="border-border hover:bg-muted/20 border-b last:border-0">
                <td className="bg-card sticky start-0 px-4 py-2 font-medium">{label}</td>
                {EDITABLE_ROLES.map((role) => {
                  const has = isFullAccessRole(role) || draft[role]?.includes(perm as Permission);
                  return (
                    <td key={role} className="px-3 py-2 text-center">
                      {has ? '✅' : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
