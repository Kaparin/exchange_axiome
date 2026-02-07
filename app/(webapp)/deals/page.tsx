"use client"

import { useEffect, useState } from "react"
import { apiGet, apiPost } from "../../../lib/webapp/client"
import type { Offer, RequestItem, TransactionItem } from "../../../lib/webapp/types"
import { useMe } from "../../../lib/webapp/use-me"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"

export default function DealsPage() {
  const { me } = useMe()
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [requestsPage, setRequestsPage] = useState(1)
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [requestFilters, setRequestFilters] = useState({
    status: "",
  })
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [myOffers, setMyOffers] = useState<Offer[]>([])
  const [offerRequests, setOfferRequests] = useState<RequestItem[]>([])
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const loadRequests = async (pageOverride?: number) => {
    const targetPage = pageOverride ?? requestsPage
    const params = new URLSearchParams()
    params.set("mine", "1")
    if (requestFilters.status) params.set("status", requestFilters.status)
    params.set("page", String(targetPage))
    params.set("pageSize", "20")

    setLoading(true)
    setError("")
    try {
      const data = await apiGet<{ requests: RequestItem[]; total: number }>(`/api/requests?${params.toString()}`)
      if (data?.requests) {
        setRequests(data.requests)
        setRequestsTotal(data.total || 0)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки заявок")
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async () => {
    setLoading(true)
    setError("")
    try {
      const data = await apiGet<{ transactions: TransactionItem[] }>("/api/transactions")
      if (data?.transactions) {
        setTransactions(data.transactions)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки сделок")
    } finally {
      setLoading(false)
    }
  }

  const loadMyOffers = async () => {
    try {
      const data = await apiGet<{ offers: Offer[] }>("/api/offers?mine=1&page=1&pageSize=50")
      if (data?.offers) {
        setMyOffers(data.offers)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки офферов")
    }
  }

  const loadOfferRequests = async (offerId: string) => {
    setActiveOfferId(offerId)
    setError("")
    try {
      const data = await apiGet<{ requests: RequestItem[] }>(`/api/requests?offerId=${offerId}`)
      if (data?.requests) {
        setOfferRequests(data.requests)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки заявок")
    }
  }

  const updateRequestStatus = async (id: string, action: "accept" | "reject" | "complete") => {
    setSubmitting(true)
    setError("")
    try {
      const data = await apiPost<{ request?: RequestItem }>(`/api/requests/${id}/${action}`)
      if (data?.request && activeOfferId) {
        await loadOfferRequests(activeOfferId)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка обновления статуса")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadRequests().catch(() => {})
    loadMyOffers().catch(() => {})
    loadTransactions().catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          <button type="button" onClick={() => setError("")} className="ml-2 text-xs text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      <Tabs defaultValue="requests">
        <TabsList className="bg-white/10 text-white/70">
          <TabsTrigger className="data-[state=active]:bg-white/20 data-[state=active]:text-white" value="requests">
            Мои заявки
          </TabsTrigger>
          <TabsTrigger className="data-[state=active]:bg-white/20 data-[state=active]:text-white" value="offers">
            Мои офферы
          </TabsTrigger>
          <TabsTrigger className="data-[state=active]:bg-white/20 data-[state=active]:text-white" value="transactions">
            Сделки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">Мои заявки</h2>
              <button
                type="button"
                onClick={() => loadRequests()}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs"
              >
                {loading ? "Загрузка..." : "Обновить"}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <select
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={requestFilters.status}
                onChange={(e) => {
                  setRequestFilters({ status: e.target.value })
                  setRequestsPage(1)
                  const params = new URLSearchParams()
                  params.set("mine", "1")
                  if (e.target.value) params.set("status", e.target.value)
                  params.set("page", "1")
                  params.set("pageSize", "20")
                  apiGet<{ requests: RequestItem[]; total: number }>(`/api/requests?${params.toString()}`)
                    .then((data) => {
                      if (data?.requests) {
                        setRequests(data.requests)
                        setRequestsTotal(data.total || 0)
                      }
                    })
                    .catch(() => {})
                }}
              >
                <option value="">Все статусы</option>
                <option value="PENDING">Ожидание</option>
                <option value="ACCEPTED">Принята</option>
                <option value="REJECTED">Отклонена</option>
                <option value="COMPLETED">Завершена</option>
              </select>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
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
            <ul className="mt-4 space-y-3 text-sm">
              {requests.length === 0 ? (
                <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
                  Пока нет заявок. Откликнитесь на оффер в разделе «Офферы».
                </li>
              ) : (
                requests.map((request) => (
                  <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/50">{new Date(request.createdAt).toLocaleString("ru-RU")}</div>
                    <div className="font-semibold">
                      {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency}
                    </div>
                    <div className="text-xs text-white/50">{{ PENDING: "Ожидание", ACCEPTED: "Принята", REJECTED: "Отклонена", COMPLETED: "Завершена" }[request.status] || request.status}</div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="offers">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-lg font-semibold">Мои офферы</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {myOffers.length === 0 ? (
                <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
                  Пока нет офферов. Создайте оффер в разделе «Офферы».
                </li>
              ) : (
                myOffers.map((offer) => (
                  <li key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between text-xs text-white/50">
                      <span>{offer.type === "BUY" ? "Покупка" : "Продажа"}</span>
                      <span>{(offer.status || "ACTIVE") === "ACTIVE" ? "Активный" : "Закрыт"}</span>
                    </div>
                    <div className="font-semibold">
                      {offer.amount} {offer.crypto} @ {offer.rate} {offer.currency}
                    </div>
                    <div className="text-xs text-white/50">
                      {offer.network} • Осталось: {offer.remaining}
                    </div>
                    <button
                      type="button"
                      onClick={() => loadOfferRequests(offer.id)}
                      className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs"
                    >
                      Заявки по офферу
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>

          {activeOfferId && (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h3 className="text-md font-semibold">Заявки по офферу</h3>
              <div className="text-xs text-white/50">
                {(() => { const o = myOffers.find(o => o.id === activeOfferId); return o ? `${o.type === "BUY" ? "Покупка" : "Продажа"} ${o.amount} ${o.crypto}` : "" })()}
              </div>
              <ul className="mt-3 space-y-2 text-sm">
                {offerRequests.map((request) => {
                  const isOwner = request.offer.userId === me?.user?.id
                  const isRequester = request.userId === me?.user?.id
                  return (
                    <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <div className="text-xs text-white/50">{new Date(request.createdAt).toLocaleString("ru-RU")}</div>
                      <div className="text-sm font-semibold">
                        {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency}
                      </div>
                      <div className="text-xs text-white/50">{{ PENDING: "Ожидание", ACCEPTED: "Принята", REJECTED: "Отклонена", COMPLETED: "Завершена" }[request.status] || request.status}</div>
                      <div className="mt-2 flex gap-2">
                        {isOwner && request.status === "PENDING" && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateRequestStatus(request.id, "accept")}
                              disabled={submitting}
                              className="rounded-lg bg-green-600 px-3 py-1 text-xs disabled:opacity-50"
                            >
                              Принять
                            </button>
                            <button
                              type="button"
                              onClick={() => updateRequestStatus(request.id, "reject")}
                              disabled={submitting}
                              className="rounded-lg bg-red-600 px-3 py-1 text-xs disabled:opacity-50"
                            >
                              Отклонить
                            </button>
                          </>
                        )}
                        {(isOwner || isRequester) && request.status === "ACCEPTED" && (
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(request.id, "complete")}
                            disabled={submitting}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs disabled:opacity-50"
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
        </TabsContent>

        <TabsContent value="transactions">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Сделки</h2>
              <button
                type="button"
                onClick={loadTransactions}
                className="rounded-lg bg-white/10 px-3 py-2 text-xs"
              >
                {loading ? "Загрузка..." : "Обновить"}
              </button>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {transactions.length === 0 ? (
                <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
                  Пока нет сделок. Завершите заявку, чтобы увидеть историю.
                </li>
              ) : (
                transactions.map((tx) => (
                  <li key={tx.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-xs text-white/50">{new Date(tx.createdAt).toLocaleString("ru-RU")}</div>
                    <div className="font-semibold">
                      {tx.amount} {tx.currency} @ {tx.rate}
                    </div>
                    <div className="text-xs text-white/50">{{ PENDING: "Ожидание", COMPLETED: "Завершена", CANCELLED: "Отменена" }[tx.status] || tx.status}</div>
                    <div className="text-xs text-white/40">
                      {new Date(tx.createdAt).toLocaleString("ru-RU")}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
