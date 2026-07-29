import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-utils'

// Umami API 配置
const UMAMI_API_URL = process.env.UMAMI_API_URL || 'https://cloud.umami.is/api'
const UMAMI_API_KEY = process.env.UMAMI_API_KEY // Umami Cloud API Key
const UMAMI_USERNAME = process.env.UMAMI_USERNAME // 自部署 Umami 用户名
const UMAMI_PASSWORD = process.env.UMAMI_PASSWORD // 自部署 Umami 密码
const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID

// 缓存 token（自部署 Umami）
let cachedToken: string | null = null
let tokenExpiry: number = 0

/**
 * 获取认证 token
 * - 如果配置了 UMAMI_API_KEY，直接使用（Umami Cloud）
 * - 如果配置了 UMAMI_USERNAME 和 UMAMI_PASSWORD，通过登录获取 token（自部署 Umami）
 */
async function getAuthToken(): Promise<string | null> {
  // 优先使用 API Key（Umami Cloud）
  if (UMAMI_API_KEY) {
    return UMAMI_API_KEY
  }

  // 使用用户名密码登录（自部署 Umami）
  if (UMAMI_USERNAME && UMAMI_PASSWORD) {
    // 检查缓存的 token 是否仍然有效
    if (cachedToken && Date.now() < tokenExpiry) {
      return cachedToken
    }

    try {
      // 登录获取 token
      const loginResponse = await fetch(`${UMAMI_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: UMAMI_USERNAME,
          password: UMAMI_PASSWORD,
        }),
      })

      if (!loginResponse.ok) {
        console.error('Umami login failed:', await loginResponse.text())
        return null
      }

      const loginData = await loginResponse.json()
      cachedToken = loginData.token
      // Token 有效期设置为 23 小时（Umami token 通常 24 小时有效）
      tokenExpiry = Date.now() + 23 * 60 * 60 * 1000

      return cachedToken
    } catch (error) {
      console.error('Error logging in to Umami:', error)
      return null
    }
  }

  return null
}

export async function GET(request: NextRequest) {
  try {
    // 验证管理员权限
    await requireAdmin()

    // 检查 Umami 是否配置
    if (!UMAMI_WEBSITE_ID) {
      return NextResponse.json(
        { error: 'Umami not configured' },
        { status: 503 }
      )
    }

    // 获取认证 token
    const token = await getAuthToken()
    if (!token) {
      return NextResponse.json(
        { error: 'Umami authentication failed. Please check your credentials.' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')

    // 计算时间范围
    const endAt = Date.now()
    const startAt = endAt - (days * 24 * 60 * 60 * 1000)

    // 准备请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }

    // 获取统计数据
    const statsResponse = await fetch(
      `${UMAMI_API_URL}/websites/${UMAMI_WEBSITE_ID}/stats?startAt=${startAt}&endAt=${endAt}`,
      { headers }
    )

    if (!statsResponse.ok) {
      console.error('Umami stats API error:', await statsResponse.text())
      return NextResponse.json(
        { error: 'Failed to fetch stats from Umami' },
        { status: statsResponse.status }
      )
    }

    const rawStats = await statsResponse.json()

    // 转换 stats 格式以匹配组件期望的格式
    const stats = {
      pageviews: {
        value: rawStats.pageviews || 0,
        change: rawStats.comparison?.pageviews || 0
      },
      visitors: {
        value: rawStats.visitors || 0,
        change: rawStats.comparison?.visitors || 0
      },
      visits: {
        value: rawStats.visits || 0,
        change: rawStats.comparison?.visits || 0
      },
      bounces: {
        value: rawStats.bounces || 0,
        change: rawStats.comparison?.bounces || 0
      },
      totaltime: {
        value: rawStats.totaltime || 0,
        change: rawStats.comparison?.totaltime || 0
      }
    }

    // 获取页面浏览量趋势
    const pageviewsResponse = await fetch(
      `${UMAMI_API_URL}/websites/${UMAMI_WEBSITE_ID}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=day`,
      { headers }
    )

    const pageviewsData = pageviewsResponse.ok ? await pageviewsResponse.json() : { pageviews: [], sessions: [] }

    // 获取事件数据（用于分析页面、来源、设备等）
    const eventsResponse = await fetch(
      `${UMAMI_API_URL}/websites/${UMAMI_WEBSITE_ID}/events?startAt=${startAt}&endAt=${endAt}&pageSize=1000`,
      { headers }
    )

    let metrics: {
      url: Array<{ x: string; y: number }>
      referrer: Array<{ x: string; y: number }>
      browser: Array<{ x: string; y: number }>
      os: Array<{ x: string; y: number }>
      device: Array<{ x: string; y: number }>
      country: Array<{ x: string; y: number }>
      language: Array<{ x: string; y: number }>
    } = {
      url: [],
      referrer: [],
      browser: [],
      os: [],
      device: [],
      country: [],
      language: []
    }

    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json()
      const events = eventsData.data || []

      // 处理事件数据，生成指标统计
      const urlMap = new Map()
      const referrerMap = new Map()
      const browserMap = new Map()
      const osMap = new Map()
      const deviceMap = new Map()
      const countryMap = new Map()

      events.forEach((event: any) => {
        // URL 统计
        if (event.urlPath) {
          urlMap.set(event.urlPath, (urlMap.get(event.urlPath) || 0) + 1)
        }

        // Referrer 统计
        if (event.referrerDomain && event.referrerDomain !== event.hostname) {
          referrerMap.set(event.referrerDomain, (referrerMap.get(event.referrerDomain) || 0) + 1)
        }

        // Browser 统计
        if (event.browser) {
          browserMap.set(event.browser, (browserMap.get(event.browser) || 0) + 1)
        }

        // OS 统计
        if (event.os) {
          osMap.set(event.os, (osMap.get(event.os) || 0) + 1)
        }

        // Device 统计
        if (event.device) {
          deviceMap.set(event.device, (deviceMap.get(event.device) || 0) + 1)
        }

        // Country 统计
        if (event.country) {
          countryMap.set(event.country, (countryMap.get(event.country) || 0) + 1)
        }
      })

      // 转换为数组并排序
      metrics = {
        url: Array.from(urlMap.entries())
          .map(([x, y]) => ({ x, y }))
          .sort((a, b) => b.y - a.y)
          .slice(0, 10),
        referrer: Array.from(referrerMap.entries())
          .map(([x, y]) => ({ x, y }))
          .sort((a, b) => b.y - a.y)
          .slice(0, 10),
        browser: Array.from(browserMap.entries())
          .map(([x, y]) => ({ x, y }))
          .sort((a, b) => b.y - a.y),
        os: Array.from(osMap.entries())
          .map(([x, y]) => ({ x, y }))
          .sort((a, b) => b.y - a.y),
        device: Array.from(deviceMap.entries())
          .map(([x, y]) => ({ x, y }))
          .sort((a, b) => b.y - a.y),
        country: Array.from(countryMap.entries())
          .map(([x, y]) => ({ x, y }))
          .sort((a, b) => b.y - a.y)
          .slice(0, 10),
        language: []
      }
    }

    // 转换 pageviews 数据格式，将 x 字段重命名为 t
    const formattedPageviews = {
      pageviews: (pageviewsData.pageviews || []).map((item: any) => ({
        t: item.x,
        y: item.y
      })),
      sessions: (pageviewsData.sessions || []).map((item: any) => ({
        t: item.x,
        y: item.y
      }))
    }

    return NextResponse.json({
      stats,
      metrics,
      pageviews: formattedPageviews,
      period: {
        startAt,
        endAt,
        days
      }
    })

  } catch (error) {
    console.error('Error fetching Umami analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

