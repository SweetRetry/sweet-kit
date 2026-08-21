"use client"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import { type FormEvent, useState } from "react"

import { authClient } from "@/lib/auth-client"

export function SignUpForm({ redirectTo }: { redirectTo: string }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const name = String(form.get("name"))
    const email = String(form.get("email"))
    const password = String(form.get("password"))

    const result = await authClient.signUp.email({ email, name, password })

    if (result.error) {
      setError(result.error.message ?? "注册失败")
      setPending(false)
      return
    }

    window.location.assign(redirectTo)
  }

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="name">名称</Label>
        <Input id="name" name="name" placeholder="输入名称" autoComplete="name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="至少 8 位"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? "创建中…" : "创建账号"}
      </Button>
    </form>
  )
}
