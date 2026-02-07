"use client"

import { useEffect, useState } from "react"
import { apiGet, apiPost } from "../../../lib/webapp/client"
import type { TransactionItem } from "../../../lib/webapp/types"

export default function RatingsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([])
  const [ratingForm, setRatingForm] = useState({
    transactionId: "",
    score: "5",
    comment: "",
  })

  const loadTransactions = async () => {
    const data = await apiGet<{ transactions: TransactionItem[] }>("/api/transactions")
    if (data?.transactions) setTransactions(data.transactions)
  }

  const createRating = async () => {
    const data = await apiPost<{ rating?: unknown }>("/api/ratings", {
      transactionId: ratingForm.transactionId,
      score: Number(ratingForm.score),
      comment: ratingForm.comment,
    })
    if (data?.rating) {
      setRatingForm({ transactionId: "", score: "5", comment: "" })
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Мои сделки</h2>
        <button type="button" onClick={loadTransactions} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs">
          Обновить список
        </button>
        <ul className="mt-4 space-y-2 text-sm">
          {transactions.map((tx) => (
            <li key={tx.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-white/50">{tx.id}</div>
              {tx.amount} {tx.currency} @ {tx.rate} • {tx.status}
              <button
                type="button"
                onClick={() => setRatingForm({ ...ratingForm, transactionId: tx.id })}
                className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-xs"
              >
                Оценить сделку
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
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
        <button type="button" onClick={createRating} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs">
          Оценить
        </button>
      </div>
    </div>
  )
}
