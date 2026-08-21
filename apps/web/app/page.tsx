import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

import { ServerStatus } from "@/components/server-status"

export default function Page() {
  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <section className="max-w-xl space-y-6 text-center">
        <p className="text-sm font-medium tracking-widest text-muted-foreground uppercase">
          Full-stack TypeScript development kit
        </p>
        <h1 className="text-5xl font-semibold tracking-tight">Sweet Kit</h1>
        <p className="text-balance text-lg text-muted-foreground">
          Next.js frontend, Hono server, OpenAPI contract, and aspect-oriented packages.
        </p>
        <ServerStatus />
        <div className="flex justify-center gap-3">
          <Button asChild>
            <Link href="/sign-in">登录</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/device">授权 CLI</Link>
          </Button>
        </div>
      </section>
    </main>
  )
}
