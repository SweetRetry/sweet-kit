"use client"

import { usePathname } from "next/navigation"
import Script from "next/script"
import { useEffect } from "react"

import {
  initializeGoogleAnalytics,
  initializeMetaPixel,
  initializeMicrosoftUet,
  trackMetaPageView,
} from "@/lib/analytics"
import { useConsentStore } from "@/lib/consent"

interface AnalyticsProps {
  googleAnalyticsId?: string
  metaPixelId?: string
  microsoftUetTagId?: string
}

/**
 * 第三方统计装配。
 *
 * 未取得同意（`consent.status !== "granted"`）时不加载任何脚本，也不上报 pageview：
 * 登录、注册与授权页同样适用。决定入口见 `components/consent-banner.tsx`。
 */
export function Analytics({ googleAnalyticsId, metaPixelId, microsoftUetTagId }: AnalyticsProps) {
  const pathname = usePathname()
  const granted = useConsentStore((state) => state.status) === "granted"

  useEffect(() => {
    if (granted && googleAnalyticsId) {
      initializeGoogleAnalytics(googleAnalyticsId)
    }
  }, [granted, googleAnalyticsId])

  useEffect(() => {
    if (granted && metaPixelId) {
      initializeMetaPixel(metaPixelId)
    }
  }, [granted, metaPixelId])

  useEffect(() => {
    if (granted && metaPixelId) {
      trackMetaPageView(metaPixelId, pathname)
    }
  }, [granted, metaPixelId, pathname])

  if (!granted) {
    return null
  }

  return (
    <>
      {googleAnalyticsId ? (
        <Script
          id="sweet-kit-google-analytics"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
          strategy="afterInteractive"
        />
      ) : null}
      {microsoftUetTagId ? (
        <Script
          id="sweet-kit-microsoft-uet"
          src="https://bat.bing.com/bat.js"
          strategy="afterInteractive"
          onLoad={() => initializeMicrosoftUet(microsoftUetTagId)}
        />
      ) : null}
      {metaPixelId ? (
        <>
          <Script
            id="sweet-kit-meta-pixel"
            src="https://connect.facebook.net/en_US/fbevents.js"
            strategy="afterInteractive"
          />
          <noscript>
            {/* biome-ignore lint/performance/noImgElement: Pixel requires a direct noscript request. */}
            <img
              alt=""
              className="hidden"
              height="1"
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`}
              width="1"
            />
          </noscript>
        </>
      ) : null}
    </>
  )
}
