"use client"

import { useState } from "react"
import { apiGet, apiPost } from "../../../lib/webapp/client"
import type { RequestItem, TransactionItem } from "../../../lib/webapp/types"

export default function DealsPage() {
  const [requests, setRequests] = useState<RequestItem[]>([])
  const [requestsPage, setRequestsPage] = useState(1)
  const [requestsTotal, setRequestsTotal] = useState(0)
  const [requestFilters, setRequestFilters] = useState({
    status: "",
  })
  const [requestForm, setRequestForm] = useState({
    offerId: "",
    amount: "50",
  })
  const [transactions, setTransactions] = useState<TransactionItem[]>([])

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

  const createRequest = async () => {
    const data = await apiPost<{ request?: RequestItem }>("/api/requests", {
      offerId: requestForm.offerId,
      amount: Number(requestForm.amount),
    })
    if (data?.request) {
      await loadRequests()
    }
  }

  const loadTransactions = async () => {
    const data = await apiGet<{ transactions: TransactionItem[] }>("/api/transactions")
    if (data?.transactions) {
      setTransactions(data.transactions)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
          <button type="button" onClick={createRequest} className="rounded-lg bg-blue-600 px-3 py-2 text-xs">
            Создать заявку
          </button>
          <button type="button" onClick={() => loadRequests()} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
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
              {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency} • {request.status}
            </li>
          ))}
        </ul>
      </div>

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
