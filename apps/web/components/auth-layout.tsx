export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-svh">
      <aside className="hidden flex-1 lg:block" aria-hidden="true">
        <img
          className="h-full w-full object-cover"
          src="/auth-bg.png"
          alt=""
        />
      </aside>
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </section>
    </main>
  )
}
