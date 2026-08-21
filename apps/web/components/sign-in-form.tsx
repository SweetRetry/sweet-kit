"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { type FormEvent, useState } from "react"

import { authClient } from "@/lib/auth-client"

export function SignInForm({ redirectTo }: { redirectTo: string }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email"))
    const password = String(form.get("password"))
    const name = String(form.get("name"))

    const result =
      mode === "sign-in"
        ? await authClient.signIn.email({ email, password })
        : await authClient.signUp.email({ email, name, password })

    if (result.error) {
      setError(result.error.message ?? "认证失败")
      setPending(false)
      return
    }

    window.location.assign(redirectTo)
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      {mode === "sign-up" ? (
        <label className="block space-y-2" htmlFor="name">
          <span className="text-sm font-medium">名称</span>
          <Input id="name" name="name" autoComplete="name" required />
        </label>
      ) : null}
      <label className="block space-y-2" htmlFor="email">
        <span className="text-sm font-medium">邮箱</span>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </label>
      <label className="block space-y-2" htmlFor="password">
        <span className="text-sm font-medium">密码</span>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
          minLength={8}
          required
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "处理中…" : mode === "sign-in" ? "登录" : "创建账号"}
      </Button>
      <Button
        className="w-full"
        type="button"
        variant="ghost"
        onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
      >
        {mode === "sign-in" ? "创建账号" : "返回登录"}
      </Button>
    </form>
  )
}
