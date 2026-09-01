import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "@workspace/ui/globals.css"
import { Analytics } from "@/components/analytics"
import { Providers } from "@/components/providers"
import { webEnv } from "@/lib/env"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Sweet Kit",
  description: "A full-stack TypeScript development kit",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
        <Analytics
          googleAnalyticsId={webEnv.googleAnalyticsId}
          metaPixelId={webEnv.metaPixelId}
          microsoftUetTagId={webEnv.microsoftUetTagId}
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
