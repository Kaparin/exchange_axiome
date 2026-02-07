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
  const [showRating, setShowRating] = useState(false)

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
      setShowRating(false)
      await loadTransactions()
    }
  }

  useEffect(() => {
    loadTransactions().catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Мои сделки</h2>
          <button type="button" onClick={loadTransactions} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
            Обновить список
          </button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {transactions.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
              Сделок пока нет.
            </li>
          ) : (
            transactions.map((tx) => {
              const canRate = tx.status === "COMPLETED"
              return (
                <li key={tx.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/50">{tx.id}</div>
                  <div className="text-sm font-semibold">
                    {tx.amount} {tx.currency} @ {tx.rate}
                  </div>
                  <div className="text-xs text-white/60">{tx.status}</div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!canRate) return
                      setRatingForm({ ...ratingForm, transactionId: tx.id })
                      setShowRating(true)
                    }}
                    className={`mt-2 rounded-lg px-3 py-1 text-xs ${canRate ? "bg-blue-600" : "bg-white/10"}`}
                  >
                    {canRate ? "Оценить сделку" : "Доступно после завершения"}
                  </button>
                </li>
              )
            })
          )}
        </ul>
      </div>

      {showRating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1322] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Оценка сделки</h3>
              <button
                type="button"
                onClick={() => setShowRating(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Закрыть
              </button>
            </div>
            <div className="mt-4 text-xs text-white/50">Сделка: {ratingForm.transactionId}</div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["1", "2", "3", "4", "5"].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setRatingForm({ ...ratingForm, score })}
                  className={`rounded-lg px-3 py-2 ${
                    ratingForm.score === score ? "bg-blue-600" : "bg-white/10"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
            <textarea
              className="mt-3 w-full rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white"
              rows={3}
              value={ratingForm.comment}
              onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
              placeholder="Комментарий"
            />
            <button
              type="button"
              onClick={createRating}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium"
            >
              Отправить оценку
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
