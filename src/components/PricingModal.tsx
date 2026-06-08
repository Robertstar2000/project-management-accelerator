import React, { useState } from 'react';
import { type Tier, FREE_TIER, PRO_TIER, PRO_PRICE_MONTHLY, PRO_PRICE_ANNUAL } from '../lib/tiers';
import { getStripeCheckoutUrl } from '../lib/stripe';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: Tier;
}

const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00ffaa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface FeatureRow {
  label: string;
  freeValue: React.ReactNode;
  proValue: React.ReactNode;
}

const features: FeatureRow[] = [
  { label: 'Projects', freeValue: <span>{FREE_TIER.maxProjects as number}</span>, proValue: <span>Unlimited</span> },
  { label: 'Phases per project', freeValue: <span>{FREE_TIER.maxPhasesPerProject as number}</span>, proValue: <span>Unlimited</span> },
  { label: 'Team members', freeValue: <span>{FREE_TIER.maxTeamMembers}</span>, proValue: <span>{PRO_TIER.maxTeamMembers}</span> },
  { label: 'AI Automation', freeValue: <XIcon />, proValue: <CheckIcon /> },
  { label: 'Advanced Analytics', freeValue: <XIcon />, proValue: <CheckIcon /> },
  { label: 'Export (PDF, ZIP)', freeValue: <XIcon />, proValue: <CheckIcon /> },
  { label: 'Team Collaboration', freeValue: <XIcon />, proValue: <CheckIcon /> },
];

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, currentTier }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  if (!isOpen) return null;

  const isCurrentFree = currentTier === 'free';
  const checkoutUrl = getStripeCheckoutUrl('pro', billingCycle);

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="glass-card"
        style={{ maxWidth: '720px', width: '100%', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Choose Your Plan</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--secondary-text)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Current tier badge */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 14px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              letterSpacing: '1px',
              background: currentTier === 'pro' ? 'rgba(0,255,170,0.15)' : 'rgba(0,242,255,0.1)',
              color: currentTier === 'pro' ? '#00ffaa' : '#00f2ff',
              border: `1px solid ${currentTier === 'pro' ? 'rgba(0,255,170,0.3)' : 'rgba(0,242,255,0.2)'}`,
            }}
          >
            {currentTier === 'pro' ? '★ PRO PLAN' : 'FREE PLAN'}
          </span>
        </div>

        {/* Billing toggle */}
        {isCurrentFree && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
              <button
                onClick={() => setBillingCycle('monthly')}
                style={{
                  padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem',
                  background: billingCycle === 'monthly' ? 'var(--accent-color)' : 'transparent',
                  color: billingCycle === 'monthly' ? '#000' : 'var(--secondary-text)',
                }}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                style={{
                  padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.9rem',
                  background: billingCycle === 'annual' ? 'var(--accent-color)' : 'transparent',
                  color: billingCycle === 'annual' ? '#000' : 'var(--secondary-text)',
                }}
              >
                Annual <span style={{ fontSize: '0.75rem', color: billingCycle === 'annual' ? '#006600' : '#00aa66' }}>(save 17%)</span>
              </button>
            </div>
          </div>
        )}

        {/* Comparison table */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: 0, border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '2rem' }}>
          {/* Header row */}
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary-text)', letterSpacing: '1px' }}>FEATURE</div>
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.03)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary-text)', letterSpacing: '1px', textAlign: 'center' }}>FREE</div>
          <div style={{ padding: '12px 16px', background: 'rgba(0,255,170,0.05)', fontWeight: 700, fontSize: '0.85rem', color: '#00ffaa', letterSpacing: '1px', textAlign: 'center' }}>PRO</div>

          {/* Feature rows */}
          {features.map((feat, i) => (
            <React.Fragment key={feat.label}>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', fontSize: '0.9rem' }}>{feat.label}</div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {feat.freeValue}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--card-border)', background: 'rgba(0,255,170,0.02)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {feat.proValue}
              </div>
            </React.Fragment>
          ))}

          {/* Price row */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--card-border)', fontWeight: 700, fontSize: '0.9rem' }}>Price</div>
          <div style={{ padding: '16px', borderTop: '1px solid var(--card-border)', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }}>$0</div>
          <div style={{ padding: '16px', borderTop: '1px solid var(--card-border)', background: 'rgba(0,255,170,0.02)', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700, color: '#00ffaa' }}>
            ${billingCycle === 'monthly' ? PRO_PRICE_MONTHLY : PRO_PRICE_ANNUAL}
            <span style={{ fontSize: '0.75rem', fontWeight: 400, color: 'var(--secondary-text)', display: 'block' }}>
              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
            </span>
          </div>
        </div>

        {/* CTA */}
        {isCurrentFree ? (
          <div style={{ textAlign: 'center' }}>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{
                display: 'inline-block', padding: '14px 48px', fontSize: '1.1rem',
                fontWeight: 700, textDecoration: 'none', borderRadius: '8px',
              }}
            >
              Upgrade to Pro — ${billingCycle === 'monthly' ? `${PRO_PRICE_MONTHLY}/mo` : `${PRO_PRICE_ANNUAL}/yr`}
            </a>
            <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
              Powered by Stripe · Cancel anytime
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: '14px 48px', fontSize: '1.1rem', fontWeight: 700, borderRadius: '8px', background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.3)', color: '#00ffaa', display: 'inline-block' }}>
              ★ You're on Pro
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
