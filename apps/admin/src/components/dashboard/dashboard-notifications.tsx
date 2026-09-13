'use client';

import { useEffect, useRef, useState } from 'react';

import { acknowledgeCurrentAdminAlerts } from '@/actions/alerts';
import { NotificationsPanel } from '@/components/dashboard/notifications-panel';
import type { AdminAlert } from '@/lib/admin-alerts';

type DashboardNotificationsProps = {
  items: AdminAlert[];
};

export function DashboardNotifications({ items: initialItems }: DashboardNotificationsProps) {
  const [items, setItems] = useState(initialItems);
  const ackedRef = useRef(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (ackedRef.current || initialItems.length === 0) return;
    ackedRef.current = true;
    void acknowledgeCurrentAdminAlerts().then(setItems);
  }, [initialItems]);

  return <NotificationsPanel items={items} />;
}
