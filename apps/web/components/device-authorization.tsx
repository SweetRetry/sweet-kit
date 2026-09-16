"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { AnimatePresence, motion, type Transition } from "motion/react"
import { type FormEvent, useState } from "react"

import { authClient } from "@/lib/auth-client"
import { dayjs } from "@/lib/dayjs"

type DeviceRequest = {
  client_id?: string
  scope?: string
}

/** 三个步骤共用同一套进出场参数：强 ease-out、短时长、随时可打断 */
const stepTransition: Transition = { duration: 0.18, ease: [0.23, 1, 0.32, 1] }

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

  return (
    <AnimatePresence initial={false} mode="wait">
      {completed ? (
        <motion.p
          key="completed"
          animate={{ opacity: 1, y: 0 }}
          className="min-h-5 rounded-md bg-muted p-4 text-sm"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: 4 }}
          transition={stepTransition}
        >
          {completed === "approved" ? "CLI 已获得授权，可以关闭此页面。" : "授权已拒绝。"}
        </motion.p>
      ) : request ? (
        <motion.div
          key="review"
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: 4 }}
          transition={stepTransition}
        >
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
          <div className="flex gap-2">
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
        </motion.div>
      ) : (
        <motion.form
          key="form"
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
          exit={{ opacity: 0, y: -4 }}
          initial={{ opacity: 0, y: 4 }}
          onSubmit={verify}
          transition={stepTransition}
        >
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
          {/* 固定一行高度：登录态与提示文案切换时不推动下方按钮 */}
          <p className="min-h-5 text-sm break-words text-muted-foreground">
            {session?.user ? (
              <>
                以 <span className="font-medium text-foreground">{session.user.email}</span>{" "}
                身份授权 · 会话有效至{" "}
                <span className="tabular-nums">
                  {dayjs(session.session.expiresAt).format("MM-DD HH:mm")}
                </span>
              </>
            ) : sessionPending ? null : (
              "继续后需要先登录。"
            )}
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button className="w-full" type="submit" disabled={pending || sessionPending}>
            检查授权请求
          </Button>
        </motion.form>
      )}
    </AnimatePresence>
  )
}
