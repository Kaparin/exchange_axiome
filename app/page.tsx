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
  _count?: { requests: number }
  userId?: string
}

type RequestItem = {
  id: string
  userId: string
  amount: number
  status: string
  offer: Offer
}

type MeResult = {
  ok?: boolean
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
  const [offers, setOffers] = useState<Offer[]>([])
  const [offerForm, setOfferForm] = useState({
    type: "SELL",
    crypto: "USDT",
    network: "TRC20",
    amount: "100",
    currency: "RUB",
    rate: "95",
  })
  const [me, setMe] = useState<MeResult | null>(null)
  const [requestForm, setRequestForm] = useState({
    offerId: "",
    amount: "50",
  })
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [offerRequests, setOfferRequests] = useState<RequestItem[]>([])
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null)

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
    await loadMe()
  }

  const loadMe = async () => {
    const res = await fetch("/api/me")
    const data = (await res.json()) as MeResult
    setMe(data)
  }

  const loadOffers = async () => {
    const res = await fetch("/api/offers")
    const data = await res.json()
    if (data?.offers) {
      setOffers(data.offers)
    }
  }

  const loadMyOffers = async () => {
    const res = await fetch("/api/offers?mine=1")
    const data = await res.json()
    if (data?.offers) {
      setOffers(data.offers)
    }
  }

  const loadRequests = async () => {
    const res = await fetch("/api/requests?mine=1")
    const data = await res.json()
    if (data?.requests) {
      setRequests(data.requests)
    }
  }

  const loadOfferRequests = async (offerId: string) => {
    setActiveOfferId(offerId)
    const res = await fetch(`/api/requests?offerId=${offerId}`)
    const data = await res.json()
    if (data?.requests) {
      setOfferRequests(data.requests)
    }
  }

  const createRequest = async () => {
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        offerId: requestForm.offerId,
        amount: Number(requestForm.amount),
      }),
    })
    const data = await res.json()
    if (data?.request) {
      await loadRequests()
      await loadOffers()
    }
  }

  const updateRequestStatus = async (id: string, action: "accept" | "reject" | "complete") => {
    const res = await fetch(`/api/requests/${id}/${action}`, { method: "POST" })
    const data = await res.json()
    if (data?.request) {
      await loadRequests()
      if (activeOfferId) {
        await loadOfferRequests(activeOfferId)
      }
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

      <div className="mt-3 text-sm text-gray-600">
        {me?.user ? `Пользователь: ${me.user.username || me.user.telegramId}` : "Сессия не найдена"}
      </div>

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
          <button
            type="button"
            onClick={loadMyOffers}
            className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1.5 text-gray-900"
          >
            Мои офферы
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded border p-2">
              <div className="font-mono text-xs text-gray-500">{offer.id}</div>
              {offer.type} {offer.amount} {offer.crypto} @ {offer.rate} {offer.currency} ({offer.network})
              <div className="text-xs text-gray-500">
                Осталось: {offer.remaining} • Заявок: {offer._count?.requests || 0}
              </div>
              <button
                type="button"
                onClick={() => loadOfferRequests(offer.id)}
                className="mt-2 inline-flex items-center rounded-md bg-gray-200 px-2 py-1 text-xs text-gray-900"
              >
                Показать заявки
              </button>
            </li>
          ))}
        </ul>
      </div>

      {activeOfferId && (
        <div className="mt-6 rounded-md border p-4">
          <h3 className="text-md font-semibold">Заявки по офферу</h3>
          <div className="text-xs text-gray-500">{activeOfferId}</div>
          <ul className="mt-3 space-y-2 text-sm">
            {offerRequests.map((request) => {
              const isOwner = request.offer.userId === me?.user?.id
              const isRequester = request.userId === me?.user?.id
              return (
                <li key={request.id} className="rounded border p-2">
                  <div className="font-mono text-xs text-gray-500">{request.id}</div>
                  {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency} •{" "}
                  {request.status}
                  <div className="mt-2 flex gap-2">
                    {isOwner && request.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(request.id, "accept")}
                          className="rounded bg-green-600 px-2 py-1 text-xs text-white"
                        >
                          Принять
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(request.id, "reject")}
                          className="rounded bg-red-600 px-2 py-1 text-xs text-white"
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    {(isOwner || isRequester) && request.status === "ACCEPTED" && (
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(request.id, "complete")}
                        className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="mt-8 rounded-md border p-4">
        <h2 className="text-lg font-semibold">Заявки</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <input
            className="rounded border px-2 py-1 col-span-2"
            value={requestForm.offerId}
            onChange={(e) => setRequestForm({ ...requestForm, offerId: e.target.value })}
            placeholder="Offer ID"
          />
          <input
            className="rounded border px-2 py-1"
            value={requestForm.amount}
            onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
            placeholder="Amount"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={createRequest}
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-white"
          >
            Создать заявку
          </button>
          <button
            type="button"
            onClick={loadRequests}
            className="inline-flex items-center rounded-md bg-gray-200 px-3 py-1.5 text-gray-900"
          >
            Мои заявки
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {requests.map((request) => (
            <li key={request.id} className="rounded border p-2">
              <div className="font-mono text-xs text-gray-500">{request.id}</div>
              {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency} •{" "}
              {request.status}
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
