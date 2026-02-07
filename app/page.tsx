"use client"

import { useEffect, useMemo, useState } from "react"

type AuthResult = {
  ok?: boolean
  error?: string
  user?: { id: string; telegramId: string; username?: string | null }
}

type Offer = {
  id: string
  type: "BUY" | "SELL"
  status?: "ACTIVE" | "CLOSED"
  crypto: string
  network: string
  amount: number
  remaining: number
  currency: string
  rate: number
  paymentInfo?: string | null
  minAmount?: number | null
  maxAmount?: number | null
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

type TransactionItem = {
  id: string
  amount: number
  currency: string
  rate: number
  status: string
  createdAt: string
  completedAt?: string | null
}

type WalletItem = {
  id: string
  type: string
  label?: string | null
  value: string
  isDefault: boolean
}

type NotificationItem = {
  id: string
  type: string
  title: string
  body?: string | null
  readAt?: string | null
  createdAt: string
}

type AdminStats = {
  users: number
  offers: number
  requests: number
  transactions: number
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
  const [offersPage, setOffersPage] = useState(1)
  const [offersTotal, setOffersTotal] = useState(0)
  const [offerFilters, setOfferFilters] = useState({
    type: "",
    status: "ACTIVE",
    crypto: "",
    network: "",
    currency: "",
    minRate: "",
    maxRate: "",
  })
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
  const [requestsPage, setRequestsPage] = useState(1)
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [requestFilters, setRequestFilters] = useState({
    status: "",
  })
  const [offerRequests, setOfferRequests] = useState<RequestItem[]>([])
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [editOfferId, setEditOfferId] = useState<string | null>(null)
  const [editOfferForm, setEditOfferForm] = useState({
    rate: "",
    minAmount: "",
    maxAmount: "",
    paymentInfo: "",
  })
  const [wallets, setWallets] = useState<WalletItem[]>([])
  const [walletForm, setWalletForm] = useState({
    type: "card",
    label: "",
    value: "",
    isDefault: false,
  })
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [ratingForm, setRatingForm] = useState({
    transactionId: "",
    score: "5",
    comment: "",
  })
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const hasSession = useMemo(() => Boolean(me?.user), [me])

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

  const loadOffers = async (pageOverride?: number) => {
    const targetPage = pageOverride ?? offersPage
    const params = new URLSearchParams()
    if (offerFilters.type) params.set("type", offerFilters.type)
    if (offerFilters.status) params.set("status", offerFilters.status)
    if (offerFilters.crypto) params.set("crypto", offerFilters.crypto)
    if (offerFilters.network) params.set("network", offerFilters.network)
    if (offerFilters.currency) params.set("currency", offerFilters.currency)
    if (offerFilters.minRate) params.set("minRate", offerFilters.minRate)
    if (offerFilters.maxRate) params.set("maxRate", offerFilters.maxRate)
    params.set("page", String(targetPage))
    params.set("pageSize", "20")

    const res = await fetch(`/api/offers?${params.toString()}`)
    const data = await res.json()
    if (data?.offers) {
      setOffers(data.offers)
      setOffersTotal(data.total || 0)
    }
  }

  const loadMyOffers = async (pageOverride?: number) => {
    const targetPage = pageOverride ?? offersPage
    const res = await fetch(`/api/offers?mine=1&page=${targetPage}&pageSize=20`)
    const data = await res.json()
    if (data?.offers) {
      setOffers(data.offers)
      setOffersTotal(data.total || 0)
    }
  }

  const loadRequests = async (pageOverride?: number) => {
    const targetPage = pageOverride ?? requestsPage
    const params = new URLSearchParams()
    params.set("mine", "1")
    if (requestFilters.status) params.set("status", requestFilters.status)
    params.set("page", String(targetPage))
    params.set("pageSize", "20")

    const res = await fetch(`/api/requests?${params.toString()}`)
    const data = await res.json()
    if (data?.requests) {
      setRequests(data.requests)
      setRequestsTotal(data.total || 0)
    }
  }

  const loadTransactions = async () => {
    const res = await fetch("/api/transactions")
    const data = await res.json()
    if (data?.transactions) {
      setTransactions(data.transactions)
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

  const loadWallets = async () => {
    const res = await fetch("/api/wallets")
    const data = await res.json()
    if (data?.wallets) {
      setWallets(data.wallets)
    }
  }

  const createWallet = async () => {
    const res = await fetch("/api/wallets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: walletForm.type,
        label: walletForm.label,
        value: walletForm.value,
        isDefault: walletForm.isDefault,
      }),
    })
    const data = await res.json()
    if (data?.wallet) {
      setWalletForm({ type: "card", label: "", value: "", isDefault: false })
      await loadWallets()
    }
  }

  const loadNotifications = async () => {
    const res = await fetch("/api/notifications")
    const data = await res.json()
    if (data?.notifications) {
      setNotifications(data.notifications)
    }
  }

  const markNotificationsRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    await loadNotifications()
  }

  const createRating = async () => {
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionId: ratingForm.transactionId,
        score: Number(ratingForm.score),
        comment: ratingForm.comment,
      }),
    })
    const data = await res.json()
    if (data?.rating) {
      setRatingForm({ transactionId: "", score: "5", comment: "" })
    }
  }

  const loadAdminStats = async () => {
    const res = await fetch("/api/admin/stats")
    const data = await res.json()
    if (data?.ok) {
      setAdminStats(data)
    }
  }

  const startEditOffer = (offer: Offer) => {
    setEditOfferId(offer.id)
    setEditOfferForm({
      rate: String(offer.rate ?? ""),
      minAmount: offer.minAmount !== null && offer.minAmount !== undefined ? String(offer.minAmount) : "",
      maxAmount: offer.maxAmount !== null && offer.maxAmount !== undefined ? String(offer.maxAmount) : "",
      paymentInfo: offer.paymentInfo || "",
    })
  }

  const saveOffer = async (offerId: string) => {
    const res = await fetch(`/api/offers/${offerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        rate: editOfferForm.rate ? Number(editOfferForm.rate) : undefined,
        minAmount: editOfferForm.minAmount ? Number(editOfferForm.minAmount) : undefined,
        maxAmount: editOfferForm.maxAmount ? Number(editOfferForm.maxAmount) : undefined,
        paymentInfo: editOfferForm.paymentInfo || undefined,
      }),
    })
    const data = await res.json()
    if (data?.offer) {
      setEditOfferId(null)
      await loadOffers()
    }
  }

  const closeOffer = async (offerId: string) => {
    const res = await fetch(`/api/offers/${offerId}`, { method: "DELETE" })
    const data = await res.json()
    if (data?.offer) {
      await loadOffers()
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
    <main
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
          <div className="text-xs text-white/60">{status}</div>
        </header>

        <section className="mx-auto max-w-6xl px-6 pb-10">
          <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Сессия</h2>
              <p className="mt-2 text-xs text-white/60">
                {hasSession ? `Пользователь: ${me?.user?.username || me?.user?.telegramId}` : "Сессия не найдена"}
              </p>
              <button
                type="button"
                onClick={handleAuth}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium"
              >
                Проверить авторизацию
              </button>
              <button
                type="button"
                onClick={() => setShowDebug((prev) => !prev)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-xs text-white/70"
              >
                {showDebug ? "Скрыть диагностику" : "Показать диагностику"}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Фильтры офферов</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.type}
                  onChange={(e) => setOfferFilters({ ...offerFilters, type: e.target.value })}
                  placeholder="Type (BUY/SELL)"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.status}
                  onChange={(e) => setOfferFilters({ ...offerFilters, status: e.target.value })}
                  placeholder="Status"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.crypto}
                  onChange={(e) => setOfferFilters({ ...offerFilters, crypto: e.target.value })}
                  placeholder="Crypto"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.network}
                  onChange={(e) => setOfferFilters({ ...offerFilters, network: e.target.value })}
                  placeholder="Network"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.currency}
                  onChange={(e) => setOfferFilters({ ...offerFilters, currency: e.target.value })}
                  placeholder="Currency"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.minRate}
                  onChange={(e) => setOfferFilters({ ...offerFilters, minRate: e.target.value })}
                  placeholder="Min rate"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerFilters.maxRate}
                  onChange={(e) => setOfferFilters({ ...offerFilters, maxRate: e.target.value })}
                  placeholder="Max rate"
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={loadOffers}
                  className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
                >
                  Обновить список
                </button>
                <button
                  type="button"
                  onClick={loadMyOffers}
                  className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
                >
                  Мои офферы
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = Math.max(1, offersPage - 1)
                    setOffersPage(nextPage)
                    loadOffers(nextPage)
                  }}
                  className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = offersPage + 1
                    setOffersPage(nextPage)
                    loadOffers(nextPage)
                  }}
                  className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
                >
                  Вперед
                </button>
                <span className="text-xs text-white/50">
                  Страница {offersPage} • Всего: {offersTotal}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[420px_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Создать оффер</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerForm.type}
                  onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                  placeholder="BUY/SELL"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerForm.crypto}
                  onChange={(e) => setOfferForm({ ...offerForm, crypto: e.target.value })}
                  placeholder="USDT"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerForm.network}
                  onChange={(e) => setOfferForm({ ...offerForm, network: e.target.value })}
                  placeholder="TRC20"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerForm.amount}
                  onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                  placeholder="Amount"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerForm.currency}
                  onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
                  placeholder="RUB"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={offerForm.rate}
                  onChange={(e) => setOfferForm({ ...offerForm, rate: e.target.value })}
                  placeholder="Rate"
                />
              </div>
              <button
                type="button"
                onClick={createOffer}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium"
              >
                Создать оффер
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Офферы</h2>
              <ul className="mt-4 space-y-3 text-sm">
                {offers.map((offer) => (
                  <li key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-white/50">{offer.id}</div>
                        <div className="font-semibold">
                          {offer.type} {offer.amount} {offer.crypto} @ {offer.rate} {offer.currency}
                        </div>
                        <div className="text-xs text-white/50">
                          {offer.network} • Статус: {offer.status || "ACTIVE"} • Осталось: {offer.remaining} • Заявок:{" "}
                          {offer._count?.requests || 0}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => loadOfferRequests(offer.id)}
                          className="rounded-lg bg-white/10 px-3 py-1 text-xs"
                        >
                          Заявки
                        </button>
                        {offer.userId === me?.user?.id && (
                          <button
                            type="button"
                            onClick={() => closeOffer(offer.id)}
                            className="rounded-lg bg-red-500/80 px-3 py-1 text-xs"
                          >
                            Закрыть
                          </button>
                        )}
                      </div>
                    </div>
                    {offer.userId === me?.user?.id && editOfferId === offer.id && (
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <input
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          value={editOfferForm.rate}
                          onChange={(e) => setEditOfferForm({ ...editOfferForm, rate: e.target.value })}
                          placeholder="Rate"
                        />
                        <input
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          value={editOfferForm.minAmount}
                          onChange={(e) => setEditOfferForm({ ...editOfferForm, minAmount: e.target.value })}
                          placeholder="Min"
                        />
                        <input
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          value={editOfferForm.maxAmount}
                          onChange={(e) => setEditOfferForm({ ...editOfferForm, maxAmount: e.target.value })}
                          placeholder="Max"
                        />
                        <input
                          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                          value={editOfferForm.paymentInfo}
                          onChange={(e) => setEditOfferForm({ ...editOfferForm, paymentInfo: e.target.value })}
                          placeholder="Payment info"
                        />
                        <button
                          type="button"
                          onClick={() => saveOffer(offer.id)}
                          className="col-span-2 rounded-lg bg-blue-600 px-3 py-2 text-xs"
                        >
                          Сохранить
                        </button>
                      </div>
                    )}
                    {offer.userId === me?.user?.id && editOfferId !== offer.id && (
                      <button
                        type="button"
                        onClick={() => startEditOffer(offer)}
                        className="mt-3 rounded-lg bg-white/10 px-3 py-1 text-xs"
                      >
                        Редактировать
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {activeOfferId && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h3 className="text-md font-semibold">Заявки по офферу</h3>
              <div className="text-xs text-white/50">{activeOfferId}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {offerRequests.map((request) => {
                  const isOwner = request.offer.userId === me?.user?.id
                  const isRequester = request.userId === me?.user?.id
                  return (
                    <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/50">{request.id}</div>
                      <div className="text-sm font-semibold">
                        {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency}
                      </div>
                      <div className="text-xs text-white/50">{request.status}</div>
                      <div className="mt-2 flex gap-2">
                        {isOwner && request.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateRequestStatus(request.id, "accept")}
                              className="rounded-lg bg-green-600 px-3 py-1 text-xs"
                            >
                              Принять
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRequestStatus(request.id, "reject")}
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs"
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                        {(isOwner || isRequester) && request.status === "ACCEPTED" && (
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(request.id, "complete")}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs"
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

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Заявки</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={requestFilters.status}
                  onChange={(e) => setRequestFilters({ ...requestFilters, status: e.target.value })}
                  placeholder="Status"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
                  value={requestForm.offerId}
                  onChange={(e) => setRequestForm({ ...requestForm, offerId: e.target.value })}
                  placeholder="Offer ID"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={requestForm.amount}
                  onChange={(e) => setRequestForm({ ...requestForm, amount: e.target.value })}
                  placeholder="Amount"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={createRequest}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs"
                >
                  Создать заявку
                </button>
                <button
                  type="button"
                  onClick={loadRequests}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Мои заявки
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = Math.max(1, requestsPage - 1)
                    setRequestsPage(nextPage)
                    loadRequests(nextPage)
                  }}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Назад
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nextPage = requestsPage + 1
                    setRequestsPage(nextPage)
                    loadRequests(nextPage)
                  }}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Вперед
                </button>
                <span className="text-xs text-white/50">
                  Страница {requestsPage} • Всего: {requestsTotal}
                </span>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {requests.map((request) => (
                  <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/50">{request.id}</div>
                    {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency} •{" "}
                    {request.status}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Транзакции</h2>
              <button
                type="button"
                onClick={loadTransactions}
                className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs"
              >
                Обновить список
              </button>
              <ul className="mt-4 space-y-2 text-sm">
                {transactions.map((tx) => (
                  <li key={tx.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/50">{tx.id}</div>
                    {tx.amount} {tx.currency} @ {tx.rate} • {tx.status}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Кошельки/реквизиты</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={walletForm.type}
                  onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value })}
                  placeholder="Тип (card, bank, crypto)"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={walletForm.label}
                  onChange={(e) => setWalletForm({ ...walletForm, label: e.target.value })}
                  placeholder="Метка"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
                  value={walletForm.value}
                  onChange={(e) => setWalletForm({ ...walletForm, value: e.target.value })}
                  placeholder="Реквизиты"
                />
                <label className="flex items-center gap-2 text-xs text-white/70">
                  <input
                    type="checkbox"
                    checked={walletForm.isDefault}
                    onChange={(e) => setWalletForm({ ...walletForm, isDefault: e.target.checked })}
                  />
                  По умолчанию
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={createWallet}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-xs"
                >
                  Добавить
                </button>
                <button
                  type="button"
                  onClick={loadWallets}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Мои реквизиты
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {wallets.map((wallet) => (
                  <li key={wallet.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    {wallet.type} • {wallet.label || "без метки"} • {wallet.value}{" "}
                    {wallet.isDefault ? "(default)" : ""}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Уведомления</h2>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={loadNotifications}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Обновить
                </button>
                <button
                  type="button"
                  onClick={markNotificationsRead}
                  className="rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Пометить прочитанными
                </button>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {notifications.map((n) => (
                  <li key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-xs text-white/60">{n.type}</div>
                    <div className="text-xs text-white/60">{n.body}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Оценка сделки</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
                  value={ratingForm.transactionId}
                  onChange={(e) => setRatingForm({ ...ratingForm, transactionId: e.target.value })}
                  placeholder="Transaction ID"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                  value={ratingForm.score}
                  onChange={(e) => setRatingForm({ ...ratingForm, score: e.target.value })}
                  placeholder="Score 1-5"
                />
                <input
                  className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
                  value={ratingForm.comment}
                  onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
                  placeholder="Комментарий"
                />
              </div>
              <button
                type="button"
                onClick={createRating}
                className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs"
              >
                Оценить
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <h2 className="text-lg font-semibold">Админка</h2>
              <button
                type="button"
                onClick={loadAdminStats}
                className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs"
              >
                Статистика
              </button>
              {adminStats && (
                <div className="mt-3 text-sm">
                  Пользователи: {adminStats.users} • Офферы: {adminStats.offers} • Заявки: {adminStats.requests} •
                  Транзакции: {adminStats.transactions}
                </div>
              )}
            </div>
          </div>

          {showDebug && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-white/70">
              <div>Auth:</div>
              <pre className="mt-2 whitespace-pre-wrap text-[11px]">{JSON.stringify(authResult, null, 2)}</pre>
              <div className="mt-4">Debug:</div>
              <pre className="mt-2 whitespace-pre-wrap text-[11px]">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
