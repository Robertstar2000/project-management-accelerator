// Stripe billing scaffold for MIFECO PM Accelerator
// Replace placeholder URLs / secrets with real values via environment variables.

import type { Tier } from './tiers';

// ─── Configuration ──────────────────────────────────────────────────

/** Stripe Payment Link for Pro – Monthly */
export const STRIPE_PAYMENT_LINK_MONTHLY =
  import.meta.env?.STRIPE_PAYMENT_LINK_MONTHLY ??
  'https://buy.stripe.com/test_placeholder_monthly';

/** Stripe Payment Link for Pro – Annual */
export const STRIPE_PAYMENT_LINK_ANNUAL =
  import.meta.env?.STRIPE_PAYMENT_LINK_ANNUAL ??
  'https://buy.stripe.com/test_placeholder_annual';

export type BillingCycle = 'monthly' | 'annual';

// ─── Helpers ────────────────────────────────────────────────────────

/** Return the Stripe checkout URL for a given tier + billing cycle. */
export function getStripeCheckoutUrl(
  tier: Tier,
  billingCycle: BillingCycle,
): string {
  if (tier === 'free') return '/';
  if (billingCycle === 'annual') return STRIPE_PAYMENT_LINK_ANNUAL;
  return STRIPE_PAYMENT_LINK_MONTHLY;
}
