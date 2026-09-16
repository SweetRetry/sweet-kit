"use client"

import { Google } from "@lobehub/icons"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"
import { toast } from "@/lib/toast"

/**
 * Google 登录入口。
 *
 * provider 由部署环境决定（server 的 `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`），
 * 未配置或调用失败时回退到邮箱登录：复位按钮并给出提示，不留下永久禁用的按钮。
 */
export function SocialLogin() {
  const [pending, setPending] = useState(false)

  async function handleGoogle() {
    setPending(true)

    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/" })

      if (result.error) {
        toast.error(result.error.message ?? "Google 登录不可用，请使用邮箱登录")
        setPending(false)
      }
    } catch {
      toast.error("Google 登录失败，请使用邮箱登录")
      setPending(false)
    }
  }

  return (
    <Button
      className="w-full"
      variant="outline"
      size="lg"
      disabled={pending}
      onClick={handleGoogle}
    >
      <Google.Color size={20} />
      Google
    </Button>
  )
}
