"use client"

import { useEffect, useState } from "react"

type AuthResult = {
  ok?: boolean
  error?: string
  user?: { id: string; telegramId: string; username?: string | null }
}

export default function Home() {
  const [status, setStatus] = useState("Ожидание Telegram WebApp...")
  const [authResult, setAuthResult] = useState<AuthResult | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const webApp = (window as any)?.Telegram?.WebApp
    if (!webApp) {
      setStatus("Telegram WebApp не обнаружен")
      return
    }
    webApp.ready?.()
    setStatus("Telegram WebApp готов")
  }, [])

  const handleAuth = async () => {
    const webApp = (window as any)?.Telegram?.WebApp
    if (!webApp?.initData) {
      setAuthResult({ error: "initData не найден" })
      return
    }

    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData: webApp.initData }),
    })
    const data = (await res.json()) as AuthResult
    setAuthResult(data)
  }

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold">Telegram Mini App</h1>
      <p className="text-sm text-gray-600 mt-2">{status}</p>

      <button
        type="button"
        onClick={handleAuth}
        className="mt-6 inline-flex items-center rounded-md bg-black px-4 py-2 text-white"
      >
        Проверить авторизацию
      </button>

      {authResult && (
        <pre className="mt-4 rounded-md bg-gray-100 p-3 text-xs text-gray-800">
          {JSON.stringify(authResult, null, 2)}
        </pre>
      )}
    </main>
  )
}
