"use client"

import Script from 'next/script'
import { seoConfig } from '@/lib/seo-config'

export function GoogleAnalytics() {
  const gaId = seoConfig.analytics.googleAnalytics
  
  if (!gaId) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}');
        `}
      </Script>
    </>
  )
}

export function BaiduAnalytics() {
  const baiduId = seoConfig.analytics.baiduAnalytics
  
  if (!baiduId) {
    return null
  }

  return (
    <Script id="baidu-analytics" strategy="afterInteractive">
      {`
        var _hmt = _hmt || [];
        (function() {
          var hm = document.createElement("script");
          hm.src = "https://hm.baidu.com/hm.js?${baiduId}";
          var s = document.getElementsByTagName("script")[0]; 
          s.parentNode.insertBefore(hm, s);
        })();
      `}
    </Script>
  )
}

export function UmamiAnalytics() {
  const websiteId = seoConfig.analytics.umamiWebsiteId
  const scriptUrl = seoConfig.analytics.umamiScriptUrl

  if (!websiteId || !scriptUrl) {
    return null
  }

  return (
    <Script
      src={scriptUrl}
      data-website-id={websiteId}
      strategy="afterInteractive"
    />
  )
}

// 通用分析组件
export function Analytics() {
  return (
    <>
      <GoogleAnalytics />
      <BaiduAnalytics />
      <UmamiAnalytics />
    </>
  )
}
