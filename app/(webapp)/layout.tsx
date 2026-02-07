"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { apiGet } from "../../lib/webapp/client"
import type { MeResult } from "../../lib/webapp/types"

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

type AuthState =
  | { status: "loading"; message?: string }
  | { status: "ready"; message?: string }
  | { status: "error"; message: string }

function getInitDataFromHash() {
  if (typeof window === "undefined") return null
  const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : window.location.hash
  const params = new URLSearchParams(hash)
  const data = params.get("tgWebAppData")
  if (!data) return null
  try {
    return decodeURIComponent(data)
  } catch {
    return data
  }
}

function getInitData() {
  if (typeof window === "undefined") return null
  const tg = (window as any).Telegram?.WebApp
  if (tg?.initData) return tg.initData
  return getInitDataFromHash()
}

export default function WebAppLayout({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({ status: "loading" })
  const [me, setMe] = useState<MeResult | null>(null)

  const authorize = async () => {
    const initData = getInitData()
    if (!initData) {
      setAuthState({
        status: "error",
        message: "Откройте приложение через Telegram Mini App.",
      })
      return
    }

    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ initData }),
      })
      const data = await res.json()
      if (!res.ok || !data?.user) {
        setAuthState({ status: "error", message: data?.error || "Ошибка авторизации" })
        return
      }
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search)
      }
      setAuthState({ status: "ready" })
      const meResult = await apiGet<MeResult>("/api/me")
      setMe(meResult)
    } catch {
      setAuthState({ status: "error", message: "Ошибка сети при авторизации" })
    }
  }

  useEffect(() => {
    authorize().catch(() => setAuthState({ status: "error", message: "Ошибка авторизации" }))
  }, [])

  if (authState.status !== "ready") {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="min-h-screen bg-black/90">
          <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
            <img src="/logo.png" alt="Exchange Axiome" className="h-14 w-14 rounded-2xl" />
            <h1 className="mt-4 text-xl font-semibold">Exchange Axiome</h1>
            <p className="mt-2 text-sm text-white/60">
              {authState.status === "loading" ? "Авторизация..." : authState.message}
            </p>
            {authState.status === "error" && (
              <button
                type="button"
                onClick={() => {
                  setAuthState({ status: "loading" })
                  authorize().catch(() => setAuthState({ status: "error", message: "Ошибка авторизации" }))
                }}
                className="mt-4 rounded-lg bg-white/10 px-4 py-2 text-xs"
              >
                Повторить
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

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
          <div className="flex items-center gap-3 text-xs text-white/70">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold text-white">
                {me?.user?.username ||
                  [me?.user?.firstName, me?.user?.lastName].filter(Boolean).join(" ") ||
                  me?.user?.telegramId ||
                  "Гость"}
              </div>
              <div className="text-xs text-white/50">Профиль</div>
            </div>
            {me?.user?.photoUrl ? (
              <img src={me.user.photoUrl} alt="Avatar" className="h-10 w-10 rounded-full border border-white/20" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white">
                {(me?.user?.username?.[0] ||
                  me?.user?.firstName?.[0] ||
                  me?.user?.telegramId?.[0] ||
                  "U")?.toUpperCase()}
              </div>
            )}
          </div>
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
