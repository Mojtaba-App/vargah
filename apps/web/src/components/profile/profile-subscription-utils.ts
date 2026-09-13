'use client';

import { useMemo } from 'react';
import {
  getDeliveryContactPhone,
  resolveCustomerSubscriptionView,
} from '@vargah/business/customer-subscription';

import type { CustomerProfile } from '@/actions/profile';

export function useCustomerSubscriptionView(profile: CustomerProfile) {
  return useMemo(
    () =>
      resolveCustomerSubscriptionView({
        status: profile.status,
        planType: profile.planType,
        expiresAt: profile.expiresAt,
        payments: profile.payments,
      }),
    [profile.status, profile.planType, profile.expiresAt, profile.payments],
  );
}

export function useDeliveryContactPhone(profile: CustomerProfile) {
  return useMemo(
    () => getDeliveryContactPhone(profile.deliveryPhone, profile.phone),
    [profile.deliveryPhone, profile.phone],
  );
}
