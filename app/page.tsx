"use client"

import { useEffect, useState } from "react"

type AuthResult = {
  ok?: boolean
  error?: string
  user?: { id: string; telegramId: string; username?: string | null }
}

type Offer = {
  id: string
  type: "BUY" | "SELL"
  crypto: string
  network: string
  amount: number
  remaining: number
  currency: string
  rate: number
  paymentInfo?: string | null
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
  const [offers, setOffers] = useState<Offer[]>([])
  const [offerForm, setOfferForm] = useState({
    type: "SELL",
    crypto: "USDT",
    network: "TRC20",
    amount: "100",
    currency: "RUB",
    rate: "95",
  })

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

  const loadOffers = async () => {
    const res = await fetch("/api/offers")
    const data = await res.json()
    if (data?.offers) {
      setOffers(data.offers)
    }
  }

  const createOffer = async () => {
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...offerForm,
        amount: Number(offerForm.amount),
        rate: Number(offerForm.rate),
      }),
    })
    const data = await res.json()
    if (data?.offer) {
      await loadOffers()
    }
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

      <div className="mt-8 rounded-md border p-4">
        <h2 className="text-lg font-semibold">Офферы</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <input
            className="rounded border px-2 py-1"
            value={offerForm.type}
            onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
            placeholder="BUY/SELL"
          />
          <input
            className="rounded border px-2 py-1"
            value={offerForm.crypto}
            onChange={(e) => setOfferForm({ ...offerForm, crypto: e.target.value })}
            placeholder="USDT"
          />
          <input
            className="rounded border px-2 py-1"
            value={offerForm.network}
            onChange={(e) => setOfferForm({ ...offerForm, network: e.target.value })}
            placeholder="TRC20"
          />
          <input
            className="rounded border px-2 py-1"
            value={offerForm.amount}
            onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
            placeholder="Amount"
          />
          <input
            className="rounded border px-2 py-1"
            value={offerForm.currency}
            onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
            placeholder="RUB"
          />
          <input
            className="rounded border px-2 py-1"
            value={offerForm.rate}
            onChange={(e) => setOfferForm({ ...offerForm, rate: e.target.value })}
            placeholder="Rate"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={createOffer}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-white"
          >
            Создать
          </button>
          <button
            type="button"
            onClick={loadOffers}
            className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1.5 text-gray-900"
          >
            Обновить список
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded border p-2">
              {offer.type} {offer.amount} {offer.crypto} @ {offer.rate} {offer.currency} ({offer.network})
            </li>
          ))}
        </ul>
      </div>

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
