"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { type FormEvent, useState } from "react"

import { authClient } from "@/lib/auth-client"

type DeviceRequest = {
  client_id?: string
  scope?: string
}

function normalizeUserCode(value: string) {
  return value.trim().replaceAll("-", "").toUpperCase()
}

export function DeviceAuthorization({ initialCode }: { initialCode: string }) {
  const { data: session, isPending: sessionPending } = authClient.useSession()
  const [userCode, setUserCode] = useState(initialCode)
  const [request, setRequest] = useState<DeviceRequest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [completed, setCompleted] = useState<"approved" | "denied" | null>(null)
  const [pending, setPending] = useState(false)

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = normalizeUserCode(userCode)

    if (!session?.user) {
      const redirect = `/device?user_code=${encodeURIComponent(code)}`
      window.location.assign(`/sign-in?redirect=${encodeURIComponent(redirect)}`)
      return
    }

    setError(null)
    setPending(true)
    const result = await authClient.device({ query: { user_code: code } })
    setPending(false)

    if (result.error) {
      setError(result.error.error_description ?? "授权码无效或已过期")
      return
    }

    setUserCode(code)
    setRequest(result.data)
  }

  async function decide(decision: "approve" | "deny") {
    setError(null)
    setPending(true)
    const result =
      decision === "approve"
        ? await authClient.device.approve({ userCode })
        : await authClient.device.deny({ userCode })
    setPending(false)

    if (result.error) {
      setError(result.error.error_description ?? "无法完成授权")
      return
    }

    setCompleted(decision === "approve" ? "approved" : "denied")
  }

  if (completed) {
    return (
      <p className="rounded-md bg-muted p-4 text-sm">
        {completed === "approved" ? "CLI 已获得授权，可以关闭此页面。" : "授权已拒绝。"}
      </p>
    )
  }

  if (request) {
    return (
      <div className="space-y-5">
        <div className="space-y-2 rounded-md bg-muted p-4 text-sm">
          <p>
            <span className="text-muted-foreground">客户端：</span>
            {request.client_id ?? "未知客户端"}
          </p>
          <p>
            <span className="text-muted-foreground">权限：</span>
            {request.scope ?? "登录会话"}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          仅在该授权码与自己终端显示的一致时批准。不要批准他人发送的授权码。
        </p>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex gap-3">
          <Button className="flex-1" disabled={pending} onClick={() => decide("approve")}>
            批准
          </Button>
          <Button
            className="flex-1"
            variant="outline"
            disabled={pending}
            onClick={() => decide("deny")}
          >
            拒绝
          </Button>
        </div>
      </div>
    )
  }

  return (
    <form className="space-y-4" onSubmit={verify}>
      <label className="block space-y-2" htmlFor="user-code">
        <span className="text-sm font-medium">设备授权码</span>
        <Input
          id="user-code"
          value={userCode}
          onChange={(event) => setUserCode(event.target.value)}
          autoComplete="one-time-code"
          placeholder="ABCD-EFGH"
          required
        />
      </label>
      {!sessionPending && !session?.user ? (
        <p className="text-sm text-muted-foreground">继续后需要先登录。</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending || sessionPending}>
        检查授权请求
      </Button>
    </form>
  )
}
