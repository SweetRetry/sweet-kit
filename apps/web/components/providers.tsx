"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "@workspace/ui/components/sonner"
import { MotionConfig } from "motion/react"
import { type ReactNode, useState } from "react"

import { ConsentBanner } from "@/components/consent-banner"

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* reducedMotion="user" 让所有 motion 动效跟随系统设置移除位移与缩放 */}
      <MotionConfig reducedMotion="user">
        {children}
        <ConsentBanner />
        <Toaster />
      </MotionConfig>
    </QueryClientProvider>
  )
}
