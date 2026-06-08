// Tier definitions and feature flags for MIFECO PM Accelerator

export type Tier = 'free' | 'pro';

export interface TierConfig {
  name: string;
  maxProjects: number | 'unlimited';
  maxPhasesPerProject: number | 'unlimited';
  hasAutomation: boolean;
  hasAnalytics: boolean;
  hasExport: boolean;
  hasCollaboration: boolean;
  maxTeamMembers: number;
}

export const FREE_TIER: TierConfig = {
  name: 'Free',
  maxProjects: 3,
  maxPhasesPerProject: 5,
  hasAutomation: false,
  hasAnalytics: false,
  hasExport: false,
  hasCollaboration: false,
  maxTeamMembers: 1,
};

export const PRO_TIER: TierConfig = {
  name: 'Pro',
  maxProjects: 'unlimited',
  maxPhasesPerProject: 'unlimited',
  hasAutomation: true,
  hasAnalytics: true,
  hasExport: true,
  hasCollaboration: true,
  maxTeamMembers: 10,
};

export const TIER_MAP: Record<Tier, TierConfig> = {
  free: FREE_TIER,
  pro: PRO_TIER,
};

// Price constants (in USD cents for Stripe)
export const PRO_PRICE_MONTHLY = 29;
export const PRO_PRICE_ANNUAL = 290;

// ─── Helper functions ───────────────────────────────────────────────

/** Check whether the given tier is Pro (or above). */
export function isPro(tier: Tier | string): boolean {
  return tier === 'pro';
}

/** Can the user create another project given their tier and current count? */
export function canCreateProject(tier: Tier | string, currentCount: number): boolean {
  const cfg = TIER_MAP[tier as Tier];
  if (!cfg) return false;
  if (cfg.maxProjects === 'unlimited') return true;
  return currentCount < cfg.maxProjects;
}

/** Can the user access automation features? */
export function canUseAutomation(tier: Tier | string): boolean {
  return isPro(tier);
}

/** Can the user access analytics/dashboard features? */
export function canUseAnalytics(tier: Tier | string): boolean {
  return isPro(tier);
}

/** Can the user export project data? */
export function canUseExport(tier: Tier | string): boolean {
  return isPro(tier);
}

/** Can the user collaborate with team members? */
export function canUseCollaboration(tier: Tier | string): boolean {
  return isPro(tier);
}

/** Get the max number of projects allowed for a tier. */
export function getMaxProjects(tier: Tier | string): number | 'unlimited' {
  const cfg = TIER_MAP[tier as Tier];
  return cfg?.maxProjects ?? FREE_TIER.maxProjects;
}

/** Get the max number of phases per project allowed for a tier. */
export function getMaxPhases(tier: Tier | string): number | 'unlimited' {
  const cfg = TIER_MAP[tier as Tier];
  return cfg?.maxPhasesPerProject ?? FREE_TIER.maxPhasesPerProject;
}

/** Get the max number of team members allowed for a tier. */
export function getMaxTeamMembers(tier: Tier | string): number {
  const cfg = TIER_MAP[tier as Tier];
  return cfg?.maxTeamMembers ?? FREE_TIER.maxTeamMembers;
}

/** Get all feature flags for a tier as a flat object. */
export function getFeatureFlags(tier: Tier | string): {
  maxProjects: number | 'unlimited';
  maxPhasesPerProject: number | 'unlimited';
  hasAutomation: boolean;
  hasAnalytics: boolean;
  hasExport: boolean;
  hasCollaboration: boolean;
  maxTeamMembers: number;
} {
  const cfg = TIER_MAP[tier as Tier] ?? FREE_TIER;
  return { ...cfg };
}
