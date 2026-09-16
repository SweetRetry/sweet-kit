"use client"

import { Button } from "@workspace/ui/components/button"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

import { useConsentStore } from "@/lib/consent"

/**
 * 统计同意条。
 *
 * 全局固定层按 Z-Index 阶梯取 `z-30`（持久性全局导航/操作条）；进出场用 opacity + y，
 * 强 ease-out 且可打断：决定写入 store 是即时的，动画只负责收尾。
 */
export function ConsentBanner() {
  const [hydrated, setHydrated] = useState(false)
  const status = useConsentStore((state) => state.status)
  const accept = useConsentStore((state) => state.accept)
  const decline = useConsentStore((state) => state.decline)

  // 持久化状态只在客户端可读：首帧不渲染，避免服务端与客户端结构不一致
  useEffect(() => setHydrated(true), [])

  const visible = hydrated && status === "unknown"

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-2xl flex-col gap-4 rounded-xl border bg-card p-4 shadow-lg sm:flex-row sm:items-center"
          exit={{ opacity: 0, y: 8 }}
          initial={{ opacity: 0, y: 8 }}
          role="region"
          aria-label="统计同意"
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
        >
          <p className="min-w-0 flex-1 text-sm text-muted-foreground">
            本站使用第三方统计（Google Analytics、Meta Pixel、Microsoft UET）。接受后才会加载脚本。
          </p>
          <div className="flex shrink-0 gap-2">
            <Button onClick={accept} size="sm">
              接受统计
            </Button>
            <Button onClick={decline} size="sm" variant="outline">
              仅必要
            </Button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
