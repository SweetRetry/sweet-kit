"use client"

import { Google } from "@lobehub/icons"
import { Button } from "@workspace/ui/components/button"
import { useState } from "react"

import { authClient } from "@/lib/auth-client"

export function SocialLogin() {
  const [pending, setPending] = useState(false)

  async function handleGoogle() {
    setPending(true)
    await authClient.signIn.social({ provider: "google", callbackURL: "/" })
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
