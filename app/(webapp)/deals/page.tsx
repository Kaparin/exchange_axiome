"use client"

import { useEffect, useState } from "react"
import { apiGet, apiPost } from "../../../lib/webapp/client"
import type { Offer, RequestItem, TransactionItem } from "../../../lib/webapp/types"
import { useMe } from "../../../lib/webapp/use-me"

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

  const loadRequests = async (pageOverride?: number) => {
    const targetPage = pageOverride ?? requestsPage
    const params = new URLSearchParams()
    params.set("mine", "1")
    if (requestFilters.status) params.set("status", requestFilters.status)
    params.set("page", String(targetPage))
    params.set("pageSize", "20")

    const data = await apiGet<{ requests: RequestItem[]; total: number }>(`/api/requests?${params.toString()}`)
    if (data?.requests) {
      setRequests(data.requests)
      setRequestsTotal(data.total || 0)
    }
  }

  const loadTransactions = async () => {
    const data = await apiGet<{ transactions: TransactionItem[] }>("/api/transactions")
    if (data?.transactions) {
      setTransactions(data.transactions)
    }
  }

  const loadMyOffers = async () => {
    const data = await apiGet<{ offers: Offer[] }>("/api/offers?mine=1&page=1&pageSize=50")
    if (data?.offers) {
      setMyOffers(data.offers)
    }
  }

  const loadOfferRequests = async (offerId: string) => {
    setActiveOfferId(offerId)
    const data = await apiGet<{ requests: RequestItem[] }>(`/api/requests?offerId=${offerId}`)
    if (data?.requests) {
      setOfferRequests(data.requests)
    }
  }

  const updateRequestStatus = async (id: string, action: "accept" | "reject" | "complete") => {
    const data = await apiPost<{ request?: RequestItem }>(`/api/requests/${id}/${action}`)
    if (data?.request && activeOfferId) {
      await loadOfferRequests(activeOfferId)
    }
  }

  useEffect(() => {
    loadRequests().catch(() => {})
    loadMyOffers().catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Мои заявки</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <input
            className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
            value={requestFilters.status}
            onChange={(e) => setRequestFilters({ ...requestFilters, status: e.target.value })}
            placeholder="Status"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => loadRequests()} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
            Обновить
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
        <ul className="mt-4 space-y-3 text-sm">
          {requests.map((request) => (
            <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/50">{request.id}</div>
              <div className="font-semibold">
                {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency}
              </div>
              <div className="text-xs text-white/50">{request.status}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Мои офферы</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {myOffers.map((offer) => (
            <li key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/50">{offer.id}</div>
              <div className="font-semibold">
                {offer.type} {offer.amount} {offer.crypto} @ {offer.rate} {offer.currency}
              </div>
              <button
                type="button"
                onClick={() => loadOfferRequests(offer.id)}
                className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs"
              >
                Заявки по офферу
              </button>
            </li>
          ))}
        </ul>
      </div>

      {activeOfferId && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-md font-semibold">Заявки по офферу</h3>
          <div className="text-xs text-white/50">{activeOfferId}</div>
          <ul className="mt-3 space-y-2 text-sm">
            {offerRequests.map((request) => {
              const isOwner = request.offer.userId === me?.user?.id
              const isRequester = request.userId === me?.user?.id
              return (
                <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/50">{request.id}</div>
                  {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency} •{" "}
                  {request.status}
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

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Транзакции</h2>
        <button type="button" onClick={loadTransactions} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs">
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
  )
}
