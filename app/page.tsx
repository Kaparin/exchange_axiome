"use client"

import { useEffect, useState } from "react"

type AuthResult = {
  ok?: boolean
  error?: string
  user?: { id: string; telegramId: string; username?: string | null }
}

function getInitDataFromHash(): string | null {
  if (typeof window === "undefined") return null
  const hash = window.location.hash
  if (!hash.startsWith("#")) return null
  const params = new URLSearchParams(hash.slice(1))
  const initData = params.get("tgWebAppData")
  return initData || null
}

export default function Home() {
  const [status, setStatus] = useState("Ожидание Telegram WebApp...")
  const [authResult, setAuthResult] = useState<AuthResult | null>(null)
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown> | null>(null)
  const [initData, setInitData] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const webApp = (window as any)?.Telegram?.WebApp
    const hashInitData = getInitDataFromHash()
    if (!webApp) {
      if (hashInitData) {
        setStatus("WebApp параметры получены из URL")
        setInitData(hashInitData)
      } else {
        setStatus("Telegram WebApp не обнаружен")
      }
      setDebugInfo({
        hasTelegram: Boolean((window as any)?.Telegram),
        hasWebApp: false,
        initDataSource: hashInitData ? "hash" : "none",
        initDataLength: hashInitData?.length || 0,
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
      return
    }
    webApp.ready?.()
    setStatus("Telegram WebApp готов")
    setInitData(webApp.initData || hashInitData)
    setDebugInfo({
      hasTelegram: true,
      hasWebApp: true,
      version: webApp.version,
      platform: webApp.platform,
      initDataSource: webApp.initData ? "webapp" : hashInitData ? "hash" : "none",
      initDataLength: webApp.initData?.length || hashInitData?.length || 0,
      initDataUnsafe: webApp.initDataUnsafe || null,
      colorScheme: webApp.colorScheme,
      userAgent: navigator.userAgent,
      url: window.location.href,
    })
  }, [])

  const handleAuth = async () => {
    if (!initData) {
      setAuthResult({ error: "initData не найден" })
      return
    }

    const res = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
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

      {debugInfo && (
        <pre className="mt-4 rounded-md bg-gray-100 p-3 text-xs text-gray-800">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </main>
  )
}
