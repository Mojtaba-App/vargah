'use client';

import { useState } from 'react';

import { adminApiPath, adminPublicUrl } from '@/lib/base-path';
import { ConfirmDialog } from '@/components/ui/feedback/confirm-dialog';
import { LogOutIcon } from '@/components/layout/nav-icons';
import { cn } from '@/lib/utils';

type SidebarFooterProps = {
  collapsed: boolean;
};

export function SidebarFooter({ collapsed }: SidebarFooterProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch(adminApiPath('/api/auth/logout'), {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      window.location.replace(adminPublicUrl('login'));
    }
  };

  return (
    <>
      <div className="border-brand-800/50 shrink-0 border-t p-2">
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={isLoggingOut}
          title="خروج از حساب"
          className={cn(
            'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-200 transition-colors hover:bg-rose-500/20 hover:text-rose-100 disabled:opacity-60',
            collapsed && 'justify-center px-2',
          )}
        >
          <LogOutIcon className="size-5 shrink-0" />
          {!collapsed && <span>{isLoggingOut ? 'در حال خروج...' : 'خروج از حساب'}</span>}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="خروج از حساب"
        description="آیا مطمئن هستید که می‌خواهید از پنل مدیریت خارج شوید؟"
        confirmLabel="بله، خروج"
        cancelLabel="انصراف"
        variant="destructive"
        loading={isLoggingOut}
        onConfirm={() => void handleLogout()}
        onCancel={() => {
          if (!isLoggingOut) setConfirmOpen(false);
        }}
      />
    </>
  );
}
