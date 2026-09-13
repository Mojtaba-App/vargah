import { NextResponse } from 'next/server';

import { setCustomerSessionCookie } from '@/lib/customer-auth/session';
import { verifySubscriptionCallback } from '@/lib/payments/verify-subscription-callback';

function redirectToSubscription(request: Request, params: Record<string, string>) {
  const url = new URL(request.url);
  const target = new URL(`/fa/subscription`, url.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value) target.searchParams.set(key, value);
  }
  return NextResponse.redirect(target);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentId = url.searchParams.get('paymentId') ?? '';
  const authority = url.searchParams.get('Authority') ?? '';
  const status = url.searchParams.get('Status') ?? '';

  if (!paymentId || !authority) {
    return redirectToSubscription(request, { payment: 'error' });
  }

  try {
    const result = await verifySubscriptionCallback({ paymentId, authority, status });

    if (!result.ok) {
      return redirectToSubscription(request, {
        payment: result.reason === 'cancelled' ? 'cancelled' : 'failed',
      });
    }

    if (result.subscriber) {
      const phone = result.subscriber.phone?.trim();
      if (phone) {
        await setCustomerSessionCookie({
          subscriberId: result.subscriber.id,
          phone,
          name: result.subscriber.name ?? 'مشترک',
          email: result.subscriber.email ?? '',
        });
      }
    }

    return redirectToSubscription(request, {
      payment: 'success',
      ref: result.alreadyPaid ? 'duplicate' : String(result.refId ?? ''),
    });
  } catch {
    return redirectToSubscription(request, { payment: 'failed' });
  }
}
