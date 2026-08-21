import Link from "next/link"

import { SignInForm } from "@/components/sign-in-form"

function safeRedirect(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/"
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const { redirect } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <section className="w-full max-w-sm space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">登录 Sweet Kit</h1>
          <p className="text-sm text-muted-foreground">登录后可以批准 CLI device authorization。</p>
        </div>
        <SignInForm redirectTo={safeRedirect(redirect)} />
        <Link
          className="block text-center text-sm text-muted-foreground hover:text-foreground"
          href="/"
        >
          返回首页
        </Link>
      </section>
    </main>
  )
}
