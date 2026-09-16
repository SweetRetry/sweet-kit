"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ConsentStatus = "unknown" | "granted" | "denied"

interface ConsentState {
  accept(): void
  decline(): void
  status: ConsentStatus
}

/**
 * 统计脚本的同意状态。
 *
 * 默认 `unknown`：Analytics 在用户明确接受前不加载任何第三方脚本（见 `components/analytics.tsx`）。
 * 决定写进 localStorage，跨会话保持；拒绝后可以随时通过同一入口重新接受。
 */
export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      accept: () => set({ status: "granted" }),
      decline: () => set({ status: "denied" }),
      status: "unknown",
    }),
    { name: "sweet-kit-consent" }
  )
)
