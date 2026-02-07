"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const navItems = [
  { href: "/market", label: "Офферы" },
  { href: "/deals", label: "Сделки" },
  { href: "/wallets", label: "Реквизиты" },
  { href: "/notifications", label: "Уведомления" },
  { href: "/ratings", label: "Рейтинг" },
  { href: "/profile", label: "Профиль" },
  { href: "/admin", label: "Админ" },
]

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname()
  const active = pathname === href
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm ${
        active ? "bg-white/15 text-white" : "text-white/60 hover:text-white"
      }`}
    >
      {label}
    </Link>
  )
}

export default function WebAppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{
        backgroundImage: "url('/Futuristic cryptocurrency exchange interface design.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="min-h-screen bg-black/80">
        <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Exchange Axiome" className="h-12 w-12 rounded-xl" />
            <div>
              <h1 className="text-2xl font-semibold">Exchange Axiome</h1>
              <p className="text-xs text-white/60">Telegram Mini App</p>
            </div>
          </div>
          <div className="text-xs text-white/60">Live</div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-6 pb-20 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </aside>

          <main className="min-h-[70vh] rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            {children}
          </main>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black/80 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl justify-between px-4 py-3 text-xs">
            {navItems.slice(0, 5).map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}
