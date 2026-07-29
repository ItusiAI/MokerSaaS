"use client"

import React, { useEffect, useState } from 'react';
import { Check, Zap } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { StripeCheckoutButton } from '@/components/stripe-checkout-button';
import { SUBSCRIPTION_PRICE_IDS } from '@/lib/stripe';

interface PricingSectionProps {
  onOpenDeploy?: () => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onOpenDeploy }) => {
  const t = useTranslations("pricing");
  const { data: session } = useSession();
  const [hasTrialSubscription, setHasTrialSubscription] = useState(false);
  const [hasActiveProSubscription, setHasActiveProSubscription] = useState(false);
  const [hasActiveAnnualSubscription, setHasActiveAnnualSubscription] = useState(false);
  const [currentSubscriptionPlan, setCurrentSubscriptionPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!session?.user) {
        return;
      }

      try {
        const response = await fetch('/api/user/subscription');
        if (response.ok) {
          const data = await response.json();
          setHasTrialSubscription(data.hasTrialSubscription || false);
          setCurrentSubscriptionPlan(data.subscriptionPlan || null);

          const now = new Date();
          const isActivePro =
            data.subscriptionStatus === 'active' &&
            data.subscriptionPlan === 'pro' &&
            data.subscriptionCurrentPeriodEnd &&
            new Date(data.subscriptionCurrentPeriodEnd) > now;

          setHasActiveProSubscription(isActivePro || false);

          const isActiveAnnual =
            data.subscriptionStatus === 'active' &&
            data.subscriptionPlan === 'annual' &&
            data.subscriptionCurrentPeriodEnd &&
            new Date(data.subscriptionCurrentPeriodEnd) > now;

          setHasActiveAnnualSubscription(isActiveAnnual || false);
        }
      } catch (error) {
        console.error(t('header.fetchStatusError'), error);
      }
    };

    fetchSubscriptionStatus();
  }, [session]);

  return (
    <section id="pricing" className="py-20 md:py-28 bg-transparent relative overflow-hidden scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card border-[var(--color-primary)]/30 text-[var(--color-primary)] font-mono-code text-xs mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>{t("header.badge")}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--color-text-primary)] tracking-tight mb-4">
            {t("header.titlePrefix")}<span className="text-[var(--color-primary)]">{t("header.titleHighlight")}</span>.
          </h2>
          <p className="text-base md:text-lg text-[var(--color-text-secondary)] max-w-xl mx-auto opacity-80">
            {t("header.subtitle")}
          </p>
        </div>

        {/* Tiers Grid */}
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          
          {/* Trial Tier (Left) */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] flex flex-col justify-between hover:border-[var(--color-text-secondary)]/40 transition-all">
            <div>
              <div className="font-mono-code text-xs text-[var(--color-accent)] uppercase tracking-wider mb-2 font-bold">{t("trial.name")}</div>
              <div className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-2">{t("trial.price")} <span className="text-xs text-[var(--color-text-secondary)] font-normal">{t("trial.periodUnit")}</span></div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-6">{t("trial.description")}</p>

              <ul className="space-y-3 font-mono-code text-xs text-[var(--color-text-primary)] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("trial.features.period")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("trial.features.points")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("trial.features.template")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("trial.features.auth")}</span>
                </li>
              </ul>
            </div>

            {(hasTrialSubscription || hasActiveProSubscription || hasActiveAnnualSubscription) ? (
              <button
                disabled
                className="w-full py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm cursor-not-allowed opacity-60"
              >
                {hasActiveProSubscription
                  ? t("trial.not_available_for_pro")
                  : hasActiveAnnualSubscription
                  ? t("trial.not_available_for_annual")
                  : t("trial.trial_only_once")}
              </button>
            ) : (
              <StripeCheckoutButton
                priceId={SUBSCRIPTION_PRICE_IDS.trial}
                planType="trial"
                variant="outline"
                className="w-full py-3 rounded-xl border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] font-bold text-sm hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all"
              >
                {t("trial.cta")}
              </StripeCheckoutButton>
            )}
          </div>

          {/* Annual Tier (Middle - Popular) */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border-2 border-[var(--color-primary)] flex flex-col justify-between relative shadow-2xl shadow-[var(--color-primary)]/10 scale-100 md:scale-105 bg-[var(--color-surface)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-[var(--color-primary)] text-white dark:text-[#4d2600] text-[10px] font-mono-code font-extrabold uppercase tracking-widest shadow whitespace-nowrap">
              {t("recommended")}
            </div>

            <div>
              <div className="font-mono-code text-xs text-[var(--color-primary)] uppercase tracking-wider mb-2 font-bold">{t("annual.name")}</div>
              <div className="text-4xl font-extrabold text-[var(--color-text-primary)] mb-2">
                {t("annual.price")} <span className="text-xs text-[var(--color-text-secondary)] font-normal">{t("annual.periodUnit")}</span>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-6">{t("annual.description")}</p>

              <ul className="space-y-3 font-mono-code text-xs text-[var(--color-text-primary)] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{t("annual.features.period")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{t("annual.features.points")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{t("annual.features.template")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{t("annual.features.payment")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{t("annual.features.support")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-primary)]" />
                  <span>{t("annual.features.value")}</span>
                </li>
              </ul>
            </div>

            {hasActiveAnnualSubscription ? (
              <StripeCheckoutButton
                priceId={SUBSCRIPTION_PRICE_IDS.annual}
                planType="annual"
                variant="default"
                className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white dark:text-[#4d2600] font-extrabold text-sm hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center"
              >
                {t("annual.renew")}
              </StripeCheckoutButton>
            ) : (
              <StripeCheckoutButton
                priceId={SUBSCRIPTION_PRICE_IDS.annual}
                planType="annual"
                variant="default"
                className="w-full py-3.5 rounded-xl bg-[var(--color-primary)] text-white dark:text-[#4d2600] font-extrabold text-sm hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all shadow-lg shadow-[var(--color-primary)]/20 flex items-center justify-center"
              >
                {currentSubscriptionPlan === 'trial' || currentSubscriptionPlan === 'pro'
                  ? t("annual.upgrade")
                  : t("annual.cta")}
              </StripeCheckoutButton>
            )}
          </div>

          {/* Pro Tier (Right) */}
          <div className="glass-card p-6 sm:p-8 rounded-2xl border border-[var(--color-border)] flex flex-col justify-between hover:border-[var(--color-primary)]/40 transition-all">
            <div>
              <div className="font-mono-code text-xs text-[var(--color-primary)] uppercase tracking-wider mb-2 font-bold">{t("pro.name")}</div>
              <div className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-2">{t("pro.price")} <span className="text-xs text-[var(--color-text-secondary)] font-normal">{t("pro.periodUnit")}</span></div>
              <p className="text-xs text-[var(--color-text-secondary)] mb-6">{t("pro.description")}</p>

              <ul className="space-y-3 font-mono-code text-xs text-[var(--color-text-primary)] mb-8">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("pro.features.period")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("pro.features.points")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("pro.features.template")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("pro.features.payment")}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[var(--color-accent)]" />
                  <span>{t("pro.features.support")}</span>
                </li>
              </ul>
            </div>

            {hasActiveProSubscription ? (
              <StripeCheckoutButton
                priceId={SUBSCRIPTION_PRICE_IDS.pro}
                planType="pro"
                variant="default"
                className="w-full py-3 rounded-xl bg-[var(--color-primary)]! text-white! dark:text-[#4d2600]! font-bold text-sm hover:bg-[var(--color-primary-hover)]! transition-all flex items-center justify-center"
              >
                {t("pro.renew")}
              </StripeCheckoutButton>
            ) : hasActiveAnnualSubscription ? (
              <button
                disabled
                className="w-full py-3 rounded-xl border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold text-sm cursor-not-allowed opacity-60"
              >
                {t("pro.cannot_downgrade")}
              </button>
            ) : (
              <StripeCheckoutButton
                priceId={SUBSCRIPTION_PRICE_IDS.pro}
                planType="pro"
                variant="outline"
                className="w-full py-3 rounded-xl border border-[var(--color-border)] bg-transparent text-[var(--color-text-primary)] font-bold text-sm hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all"
              >
                {t("pro.cta")}
              </StripeCheckoutButton>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
