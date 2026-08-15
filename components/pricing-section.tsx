"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { StripeCheckoutButton } from "./stripe-checkout-button"
import { SUBSCRIPTION_PRICE_IDS } from "@/lib/stripe"
import { DiscountPriceDisplay, RegularPriceDisplay } from "./discount-price-display"

export function PricingSection() {
  const locale = useLocale()
  const t = useTranslations("pricing")
  const { data: session } = useSession()
  const [hasTrialSubscription, setHasTrialSubscription] = useState(false)
  const [hasActiveProSubscription, setHasActiveProSubscription] = useState(false)
  const [hasActiveAnnualSubscription, setHasActiveAnnualSubscription] = useState(false)
  const [currentSubscriptionPlan, setCurrentSubscriptionPlan] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 获取用户订阅状态
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!session?.user) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/subscription')
        if (response.ok) {
          const data = await response.json()
          setHasTrialSubscription(data.hasTrialSubscription || false)
          setCurrentSubscriptionPlan(data.subscriptionPlan || null)
          
          // 检查是否有active的pro订阅
          const now = new Date()
          const isActivePro = 
            data.subscriptionStatus === 'active' &&
            data.subscriptionPlan === 'pro' &&
            data.subscriptionCurrentPeriodEnd &&
            new Date(data.subscriptionCurrentPeriodEnd) > now
          
          setHasActiveProSubscription(isActivePro || false)

          // 检查是否有active的annual订阅
          const isActiveAnnual = 
            data.subscriptionStatus === 'active' &&
            data.subscriptionPlan === 'annual' &&
            data.subscriptionCurrentPeriodEnd &&
            new Date(data.subscriptionCurrentPeriodEnd) > now
          
          setHasActiveAnnualSubscription(isActiveAnnual || false)
        }
      } catch (error) {
        console.error('获取订阅状态失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptionStatus()
  }, [session])

  const plans = [
    {
      name: t("trial.name"),
      price: t("trial.price"),
      description: t("trial.description"),
      features: [
        t("trial.features.period"),
        t("trial.features.points"),
        t("trial.features.template"),
        t("trial.features.auth"),
      ],
      cta: t("trial.cta"),
      popular: false,
      priceId: SUBSCRIPTION_PRICE_IDS.trial,
      planType: 'trial',
    },
    {
      name: t("annual.name"),
      price: t("annual.price"),
      originalPrice: t("annual.originalPrice"),
      discountPercent: t("annual.discountPercent"),
      savings: t("annual.savings"),
      discountBadge: t("annual.discountBadge"),
      description: t("annual.description"),
      features: [
        t("annual.features.period"),
        t("annual.features.template"),
        t("annual.features.points"),
        t("annual.features.payment"),
        t("annual.features.support"),
        t("annual.features.value"),
      ],
      cta: hasActiveAnnualSubscription ? t("annual.renew") : t("annual.cta"),
      popular: true,
      priceId: SUBSCRIPTION_PRICE_IDS.annual,
      planType: 'annual',
      hasDiscount: true,
    },
    {
      name: t("pro.name"),
      price: t("pro.price"),
      originalPrice: t("pro.originalPrice"),
      discountPercent: t("pro.discountPercent"),
      savings: t("pro.savings"),
      discountBadge: t("pro.discountBadge"),
      description: t("pro.description"),
      features: [
        t("pro.features.period"),
        t("pro.features.points"),
        t("pro.features.template"),
        t("pro.features.payment"),
        t("pro.features.support"),
      ],
      cta: hasActiveProSubscription ? t("pro.renew") : t("pro.cta"),
      popular: false,
      priceId: SUBSCRIPTION_PRICE_IDS.pro,
      planType: 'pro',
      hasDiscount: true,
      isActive: hasActiveProSubscription,
    },
  ]

  return (
    <section id="pricing" className="relative py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">{t("title")}</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${
                plan.popular
                  ? plan.hasDiscount
                    ? "border-primary shadow-xl scale-105 dark:bg-gradient-to-br dark:from-dark-600 dark:to-dark-600 bg-primary text-primary-foreground dark:text-card-foreground cyber-glow"
                    : "border-primary shadow-lg scale-105 dark:bg-dark-600 bg-primary/5 text-primary-foreground dark:text-card-foreground cyber-glow-subtle"
                  : "border-border bg-secondary/50"
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground cyber-glow">
                  {t("recommended")}
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>

                {/* 价格显示区域 */}
                <div className="mb-4">
                  {plan.hasDiscount ? (
                    <DiscountPriceDisplay
                      originalPrice={plan.originalPrice}
                      discountedPrice={plan.price}
                      discountPercent={plan.discountPercent}
                      savings={plan.savings}
                      discountBadge={plan.discountBadge}
                    />
                  ) : (
                    <RegularPriceDisplay price={plan.price} />
                  )}
                </div>

                <CardDescription className={plan.popular ? "text-primary-foreground dark:text-card-foreground" : ""}>
                  {plan.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className={`h-5 w-5 mr-3 flex-shrink-0 ${plan.popular ? "text-primary-foreground dark:text-card-foreground" : "text-primary"}`} />
                      <span className={`text-sm ${plan.popular ? "text-primary-foreground dark:text-card-foreground" : "text-foreground"}`}>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {/* 根据计划类型显示不同的按钮 */}
                {plan.planType === 'trial' && (hasTrialSubscription || hasActiveProSubscription || hasActiveAnnualSubscription) ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    {hasActiveProSubscription
                      ? t("trial.not_available_for_pro")
                      : hasActiveAnnualSubscription
                      ? t("trial.not_available_for_annual")
                      : t("trial.trial_only_once")}
                  </Button>
                ) : plan.planType === 'pro' && hasActiveProSubscription ? (
                  <StripeCheckoutButton
                    priceId={plan.priceId}
                    planType={plan.planType}
                    className="w-full"
                    variant="default"
                  >
                    {t("pro.renew")}
                  </StripeCheckoutButton>
                ) : plan.planType === 'pro' && hasActiveAnnualSubscription ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    {t("pro.cannot_downgrade")}
                  </Button>
                ) : plan.planType === 'annual' && hasActiveAnnualSubscription ? (
                  <StripeCheckoutButton
                    priceId={plan.priceId}
                    planType={plan.planType}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 cyber-glow"
                    variant="default"
                  >
                    {t("annual.renew")}
                  </StripeCheckoutButton>
                ) : (
                  <StripeCheckoutButton
                    priceId={plan.priceId}
                    planType={plan.planType}
                    className={`w-full ${plan.popular ? "bg-primary text-primary-foreground hover:bg-primary/90 cyber-glow" : ""}`}
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.planType === 'annual' && (currentSubscriptionPlan === 'trial' || currentSubscriptionPlan === 'pro')
                      ? t("annual.upgrade")
                      : plan.cta}
                  </StripeCheckoutButton>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
