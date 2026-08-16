import { loadStripe } from '@stripe/stripe-js'
import Stripe from 'stripe'

// 客户端Stripe实例
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// 服务端Stripe实例 - 只在有密钥时初始化
// 注意：Stripe SDK v12+ 会自动对齐到 SDK 发布时的 API 版本。
// 不再显式传 apiVersion，使用 22.5.0 SDK 默认固定的最新版本。
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  : null

// 获取价格ID的函数 - 在服务端使用环境变量，在客户端使用预设值
function getPriceId(envVar: string | undefined, fallback: string = ''): string {
  // 如果是服务端环境，直接返回环境变量
  if (typeof window === 'undefined') {
    return envVar || fallback
  }
  // 客户端返回空字符串，让服务端处理
  return fallback
}

// 订阅价格配置
export const SUBSCRIPTION_PRICE_IDS = {
  trial: getPriceId(process.env.STRIPE_TRIAL_PRICE_ID, ''),
  pro: getPriceId(process.env.STRIPE_PRO_PRICE_ID, ''),
  annual: getPriceId(process.env.STRIPE_ANNUAL_PRICE_ID, ''),
} as const

// 积分购买价格配置
export const POINTS_PRICE_IDS = {
  starter: getPriceId(process.env.STRIPE_POINTS_STARTER_PRICE_ID, ''), // 500积分 - $8
  popular: getPriceId(process.env.STRIPE_POINTS_POPULAR_PRICE_ID, ''), // 1,000积分 - $15
  premium: getPriceId(process.env.STRIPE_POINTS_PREMIUM_PRICE_ID, ''), // 15,000积分 - $150
} as const

// 向后兼容的价格配置
export const PRICE_IDS = {
  trial: SUBSCRIPTION_PRICE_IDS.trial,
  pro: SUBSCRIPTION_PRICE_IDS.pro,
  ...POINTS_PRICE_IDS,
} as const

// 获取实际的价格ID（服务端使用）
export function getActualPriceIds() {
  return {
    trial: process.env.STRIPE_TRIAL_PRICE_ID || '',
    pro: process.env.STRIPE_PRO_PRICE_ID || '',
    annual: process.env.STRIPE_ANNUAL_PRICE_ID || '',
    starter: process.env.STRIPE_POINTS_STARTER_PRICE_ID || '',
    popular: process.env.STRIPE_POINTS_POPULAR_PRICE_ID || '',
    premium: process.env.STRIPE_POINTS_PREMIUM_PRICE_ID || '',
  }
}

// 订阅产品配置
export const SUBSCRIPTION_PRODUCTS = {
  trial: {
    name: 'Trial Plan',
    priceId: SUBSCRIPTION_PRICE_IDS.trial,
    price: 4.99,
    originalPrice: 4.99,
    interval: 'week',
    intervalCount: 1, // 1周 = 7天
    giftedPoints: 1000, // 订阅赠送的积分
    features: [
      'Full access to all agents',
      '1,000 credits included',
      '7-day trial period',
      'Perfect for trying out',
    ],
  },
  pro: {
    name: 'Professional Plan',
    priceId: SUBSCRIPTION_PRICE_IDS.pro,
    price: 15.9,
    originalPrice: 19.9,
    interval: 'month',
    giftedPoints: 1000, // 订阅赠送的积分
    features: [
      'Full access to all agents',
      '1,000 credits included',
      'Agent personalization customization',
      'API interface access',
      'Dedicated customer support',
    ],
  },
  annual: {
    name: 'Annual Plan',
    priceId: SUBSCRIPTION_PRICE_IDS.annual,
    price: 159,
    originalPrice: 240, // 20 * 12 = 240
    interval: 'year',
    intervalCount: 1,
    giftedPoints: 15000, // 订阅赠送的积分
    features: [
      'Full access to all agents',
      '15,000 credits included',
      'Agent personalization customization',
      'API interface access',
      'Dedicated customer support',
      'Best value - Save 34%',
    ],
  },
  enterprise: {
    name: 'Enterprise Plan',
    priceId: null, // 企业版不使用Stripe支付
    price: 'Contact Sales',
    interval: 'custom',
    giftedPoints: 0,
    features: [
      'Custom agent development',
      'Private deployment services',
      '24/7 technical support',
      'Enterprise-grade data security',
      'Unlimited credits',
    ],
  },
} as const

// 积分购买产品配置
export const POINTS_PRODUCTS = {
  starter: {
    id: 'starter',
    name: '入门套餐',
    points: 500,
    price: 8,
    priceId: POINTS_PRICE_IDS.starter,
    description: '适合新用户试用',
  },
  popular: {
    id: 'popular',
    name: '热门套餐',
    points: 1000,
    price: 15,
    priceId: POINTS_PRICE_IDS.popular,
    description: '最受欢迎的选择',
    popular: true,
  },
  premium: {
    id: 'premium',
    name: '高级套餐',
    points: 15000,
    price: 150,
    priceId: POINTS_PRICE_IDS.premium,
    description: '适合重度用户',
  },
} as const

// 向后兼容的产品配置
export const PRODUCTS = SUBSCRIPTION_PRODUCTS

export type SubscriptionPlanType = keyof typeof SUBSCRIPTION_PRODUCTS
export type PointsPackageType = keyof typeof POINTS_PRODUCTS
export type PlanType = SubscriptionPlanType // 向后兼容 