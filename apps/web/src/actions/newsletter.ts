'use server';

import { unsubscribeFromNewsletter } from '@vargah/business/newsletter';
import { z } from 'zod';

const tokenSchema = z.string().min(16).max(128);

export async function unsubscribeNewsletterAction(token: string) {
  const parsed = tokenSchema.parse(token);
  return unsubscribeFromNewsletter(parsed);
}
