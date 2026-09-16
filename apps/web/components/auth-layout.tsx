import Image from "next/image"

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl lg:grid-cols-2">
        <aside className="relative hidden lg:block" aria-hidden="true">
          <Image
            alt=""
            className="object-cover"
            fill
            priority
            sizes="(min-width: 1024px) 448px, 1px"
            src="/auth-bg.webp"
          />
        </aside>
        <section className="flex flex-col items-center justify-center px-8 py-12 sm:px-12">
          <div className="w-full max-w-sm">{children}</div>
        </section>
      </div>
    </main>
  )
}
