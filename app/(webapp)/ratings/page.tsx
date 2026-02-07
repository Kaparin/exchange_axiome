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
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [ratedIds, setRatedIds] = useState<Set<string>>(new Set())

  const loadTransactions = async () => {
    setError("")
    try {
      const data = await apiGet<{ transactions: TransactionItem[] }>("/api/transactions")
      if (data?.transactions) setTransactions(data.transactions)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки сделок")
    }
  }

  const createRating = async () => {
    setSubmitting(true)
    setError("")
    setSuccess("")
    try {
      const data = await apiPost<{ rating?: unknown }>("/api/ratings", {
        transactionId: ratingForm.transactionId,
        score: Number(ratingForm.score),
        comment: ratingForm.comment,
      })
      if (data?.rating) {
        setRatedIds((prev) => new Set(prev).add(ratingForm.transactionId))
        setRatingForm({ transactionId: "", score: "5", comment: "" })
        setShowRating(false)
        setSuccess("Оценка отправлена")
        await loadTransactions()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка отправки оценки")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
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
      {success && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
          <button type="button" onClick={() => setSuccess("")} className="ml-2 text-xs text-green-400 hover:text-green-200">✕</button>
        </div>
      )}

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
              const canRate = tx.status === "COMPLETED" && !ratedIds.has(tx.id)
              const alreadyRated = ratedIds.has(tx.id)
              return (
                <li key={tx.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/50">{new Date(tx.createdAt).toLocaleString("ru-RU")}</div>
                  <div className="text-sm font-semibold">
                    {tx.amount} {tx.currency} @ {tx.rate}
                  </div>
                  <div className="text-xs text-white/60">{{ PENDING: "Ожидание", COMPLETED: "Завершена", CANCELLED: "Отменена" }[tx.status] || tx.status}</div>
                  <div className="text-xs text-white/40">
                    {new Date(tx.createdAt).toLocaleString("ru-RU")}
                  </div>
                  {alreadyRated ? (
                    <div className="mt-2 text-xs text-green-300">Оценка отправлена</div>
                  ) : (
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
                  )}
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
              disabled={submitting}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Отправка..." : "Отправить оценку"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
