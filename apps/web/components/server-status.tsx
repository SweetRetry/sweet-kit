"use client"

import { useQuery } from "@workspace/request/react"

import { healthQueryOptions } from "@/lib/api"

export function ServerStatus() {
  const health = useQuery(healthQueryOptions)

  if (health.isPending) {
    return <p className="text-sm text-muted-foreground">正在连接 Hono server…</p>
  }

  if (health.isError) {
    return <p className="text-sm text-destructive">Hono server 未连接</p>
  }

  return <p className="text-sm text-muted-foreground">{health.data.service} 已连接</p>
}
