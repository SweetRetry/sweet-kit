import Link from "next/link"

import { DeviceAuthorization } from "@/components/device-authorization"

export default async function DevicePage({
  searchParams,
}: {
  searchParams: Promise<{ user_code?: string }>
}) {
  const { user_code: userCode = "" } = await searchParams

  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <section className="w-full max-w-md space-y-6 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">授权 CLI</h1>
          <p className="text-sm text-muted-foreground">
            输入终端显示的 device code，检查请求内容后明确批准或拒绝。
          </p>
        </div>
        <DeviceAuthorization initialCode={userCode} />
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
