'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { SubscriptionPlanConfig } from '@vargah/business/subscription-plans';
import { getPlanSalePrice } from '@vargah/business/discounts';
import {
  clampSubscriptionQuantity,
  SUBSCRIPTION_CART_MAX_LINES,
  SUBSCRIPTION_CART_TTL_MS,
} from '@vargah/business/subscription-cart';

export const SUBSCRIPTION_CART_STORAGE_KEY = 'vargah-subscription-cart';

export type SubscriptionCartItem = {
  planSlug: string;
  quantity: number;
  name: string;
  unitPrice: number;
  type: SubscriptionPlanConfig['type'];
  period: SubscriptionPlanConfig['period'];
  periodMonths: number;
};

type StoredCartPayload = {
  updatedAt: number;
  items: SubscriptionCartItem[];
};

type SubscriptionCartContextValue = {
  items: SubscriptionCartItem[];
  itemCount: number;
  totalAmount: number;
  ready: boolean;
  drawerOpen: boolean;
  pulse: boolean;
  expiresAt: number | null;
  setDrawerOpen: (open: boolean) => void;
  addPlan: (plan: SubscriptionPlanConfig, quantity?: number) => void;
  setQuantity: (planSlug: string, quantity: number) => void;
  removeItem: (planSlug: string) => void;
  clearCart: () => void;
  syncPricesFromPlans: (plans: SubscriptionPlanConfig[]) => void;
};

const SubscriptionCartContext = createContext<SubscriptionCartContextValue | null>(null);

function normalizeItem(item: unknown): SubscriptionCartItem | null {
  if (!item || typeof item !== 'object') return null;
  const row = item as Partial<SubscriptionCartItem>;
  if (!row.planSlug || !row.name) return null;
  return {
    planSlug: String(row.planSlug),
    quantity: clampSubscriptionQuantity(Number(row.quantity) || 1),
    name: String(row.name),
    unitPrice: Math.max(0, Number(row.unitPrice) || 0),
    type:
      row.type === 'print' || row.type === 'combo' || row.type === 'digital' ? row.type : 'digital',
    period: row.period === 'yearly' ? 'yearly' : 'monthly',
    periodMonths: Math.max(1, Number(row.periodMonths) || 1),
  };
}

function parseStoredCart(raw: string | null): StoredCartPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const items = parsed
        .map(normalizeItem)
        .filter((item): item is SubscriptionCartItem => Boolean(item))
        .slice(0, SUBSCRIPTION_CART_MAX_LINES);
      if (items.length === 0) return null;
      return { updatedAt: Date.now(), items };
    }
    if (!parsed || typeof parsed !== 'object') return null;
    const payload = parsed as Partial<StoredCartPayload>;
    const updatedAt = Number(payload.updatedAt);
    if (!Number.isFinite(updatedAt) || updatedAt <= 0) return null;
    if (Date.now() - updatedAt > SUBSCRIPTION_CART_TTL_MS) return null;
    const items = (Array.isArray(payload.items) ? payload.items : [])
      .map(normalizeItem)
      .filter((item): item is SubscriptionCartItem => Boolean(item))
      .slice(0, SUBSCRIPTION_CART_MAX_LINES);
    if (items.length === 0) return null;
    return { updatedAt, items };
  } catch {
    return null;
  }
}

function writeStoredCart(items: SubscriptionCartItem[], updatedAt: number) {
  if (typeof window === 'undefined') return;
  if (items.length === 0) {
    localStorage.removeItem(SUBSCRIPTION_CART_STORAGE_KEY);
    return;
  }
  const payload: StoredCartPayload = { updatedAt, items };
  localStorage.setItem(SUBSCRIPTION_CART_STORAGE_KEY, JSON.stringify(payload));
}

export function SubscriptionCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SubscriptionCartItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    const stored = parseStoredCart(localStorage.getItem(SUBSCRIPTION_CART_STORAGE_KEY));
    if (stored) {
      setItems(stored.items);
      setUpdatedAt(stored.updatedAt);
      writeStoredCart(stored.items, stored.updatedAt);
    } else {
      localStorage.removeItem(SUBSCRIPTION_CART_STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStoredCart(items, updatedAt ?? Date.now());
  }, [items, updatedAt, ready]);

  useEffect(() => {
    if (!ready || !updatedAt || items.length === 0) return;
    const remaining = SUBSCRIPTION_CART_TTL_MS - (Date.now() - updatedAt);
    if (remaining <= 0) {
      setItems([]);
      setUpdatedAt(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setItems([]);
      setUpdatedAt(null);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [ready, updatedAt, items.length]);

  const touchCart = useCallback((next: SubscriptionCartItem[]) => {
    setItems(next);
    setUpdatedAt(next.length > 0 ? Date.now() : null);
  }, []);

  const triggerPulse = useCallback(() => {
    setPulse(true);
    window.setTimeout(() => setPulse(false), 700);
  }, []);

  const addPlan = useCallback(
    (plan: SubscriptionPlanConfig, quantity = 1) => {
      const qty = clampSubscriptionQuantity(quantity);
      setItems((prev) => {
        const existing = prev.find((item) => item.planSlug === plan.slug);
        let next: SubscriptionCartItem[];
        if (existing) {
          next = prev.map((item) =>
            item.planSlug === plan.slug
              ? {
                  ...item,
                  quantity: clampSubscriptionQuantity(item.quantity + qty),
                  name: plan.name,
                  unitPrice: getPlanSalePrice(plan),
                  type: plan.type,
                  period: plan.period,
                  periodMonths: plan.periodMonths,
                }
              : item,
          );
        } else if (prev.length >= SUBSCRIPTION_CART_MAX_LINES) {
          next = prev;
        } else {
          next = [
            ...prev,
            {
              planSlug: plan.slug,
              quantity: qty,
              name: plan.name,
              unitPrice: getPlanSalePrice(plan),
              type: plan.type,
              period: plan.period,
              periodMonths: plan.periodMonths,
            },
          ];
        }
        setUpdatedAt(next.length > 0 ? Date.now() : null);
        return next;
      });
      triggerPulse();
      setDrawerOpen(true);
    },
    [triggerPulse],
  );

  const setQuantity = useCallback((planSlug: string, quantity: number) => {
    const n = Math.floor(Number(quantity) || 0);
    setItems((prev) => {
      const next =
        n <= 0
          ? prev.filter((item) => item.planSlug !== planSlug)
          : prev.map((item) =>
              item.planSlug === planSlug
                ? { ...item, quantity: clampSubscriptionQuantity(n) }
                : item,
            );
      setUpdatedAt(next.length > 0 ? Date.now() : null);
      return next;
    });
  }, []);

  const removeItem = useCallback((planSlug: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.planSlug !== planSlug);
      setUpdatedAt(next.length > 0 ? Date.now() : null);
      return next;
    });
  }, []);

  const clearCart = useCallback(() => {
    touchCart([]);
  }, [touchCart]);

  const syncPricesFromPlans = useCallback((plans: SubscriptionPlanConfig[]) => {
    setItems((prev) => {
      const next = prev
        .map((item) => {
          const plan = plans.find((p) => p.slug === item.planSlug && p.isActive !== false);
          if (!plan) return null;
          return {
            ...item,
            name: plan.name,
            unitPrice: getPlanSalePrice(plan),
            type: plan.type,
            period: plan.period,
            periodMonths: plan.periodMonths,
          };
        })
        .filter((item): item is SubscriptionCartItem => Boolean(item));
      setUpdatedAt((current) => (next.length > 0 ? (current ?? Date.now()) : null));
      return next;
    });
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );
  const expiresAt = useMemo(
    () => (updatedAt && items.length > 0 ? updatedAt + SUBSCRIPTION_CART_TTL_MS : null),
    [updatedAt, items.length],
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalAmount,
      ready,
      drawerOpen,
      pulse,
      expiresAt,
      setDrawerOpen,
      addPlan,
      setQuantity,
      removeItem,
      clearCart,
      syncPricesFromPlans,
    }),
    [
      items,
      itemCount,
      totalAmount,
      ready,
      drawerOpen,
      pulse,
      expiresAt,
      addPlan,
      setQuantity,
      removeItem,
      clearCart,
      syncPricesFromPlans,
    ],
  );

  return (
    <SubscriptionCartContext.Provider value={value}>{children}</SubscriptionCartContext.Provider>
  );
}

export function useSubscriptionCart() {
  const ctx = useContext(SubscriptionCartContext);
  if (!ctx) {
    throw new Error('useSubscriptionCart must be used within SubscriptionCartProvider');
  }
  return ctx;
}
