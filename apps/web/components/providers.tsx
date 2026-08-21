"use client"

import { RequestProvider } from "@workspace/request/react"
import type { ReactNode } from "react"

export function Providers({ children }: { children: ReactNode }) {
  return <RequestProvider>{children}</RequestProvider>
}
