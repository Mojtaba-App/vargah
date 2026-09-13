-- Add NONE subscription status (must run in its own transaction)
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'NONE';

