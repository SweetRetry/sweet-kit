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

interface AnalyticsProps {
  googleAnalyticsId?: string
  metaPixelId?: string
  microsoftUetTagId?: string
}

export function Analytics({ googleAnalyticsId, metaPixelId, microsoftUetTagId }: AnalyticsProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (googleAnalyticsId) {
      initializeGoogleAnalytics(googleAnalyticsId)
    }
  }, [googleAnalyticsId])

  useEffect(() => {
    if (metaPixelId) {
      initializeMetaPixel(metaPixelId)
    }
  }, [metaPixelId])

  useEffect(() => {
    if (metaPixelId) {
      trackMetaPageView(metaPixelId, pathname)
    }
  }, [metaPixelId, pathname])

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
              height="1"
              src={`https://www.facebook.com/tr?id=${encodeURIComponent(metaPixelId)}&ev=PageView&noscript=1`}
              style={{ display: "none" }}
              width="1"
            />
          </noscript>
        </>
      ) : null}
    </>
  )
}
