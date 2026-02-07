"use client"

import { useEffect, useState } from "react"
import { apiGet } from "../../../lib/webapp/client"
import { useMe } from "../../../lib/webapp/use-me"
import type { Offer, TransactionItem } from "../../../lib/webapp/types"

export default function ProfilePage() {
  const { me, refresh } = useMe()
  const [offersCount, setOffersCount] = useState(0)
  const [dealsCount, setDealsCount] = useState(0)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [error, setError] = useState("")

  const loadStats = async () => {
    setError("")
    try {
      const [offersData, txData, ratingsData] = await Promise.all([
        apiGet<{ offers: Offer[]; total?: number }>("/api/offers?mine=1&page=1&pageSize=1"),
        apiGet<{ transactions: TransactionItem[] }>("/api/transactions"),
        apiGet<{ average?: number }>("/api/ratings/me").catch(() => ({ average: undefined })),
      ])
      setOffersCount(offersData.total ?? offersData.offers?.length ?? 0)
      setDealsCount(txData.transactions?.length ?? 0)
      if (ratingsData.average !== undefined) setAvgRating(ratingsData.average)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки статистики")
    }
  }

  useEffect(() => {
    loadStats().catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
          <button type="button" onClick={() => setError("")} className="ml-2 text-xs text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Профиль</h2>
        <div className="mt-3 text-sm text-white/70">
          {me?.user ? (
            <div className="space-y-1">
              <div>ID: {me.user.id}</div>
              <div>Telegram ID: {me.user.telegramId}</div>
              <div>Username: {me.user.username || "—"}</div>
              {me.user.firstName && <div>Имя: {me.user.firstName} {me.user.lastName || ""}</div>}
            </div>
          ) : (
            "Сессия не найдена"
          )}
        </div>
        <button type="button" onClick={refresh} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs">
          Обновить
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-2xl font-bold">{offersCount}</div>
          <div className="mt-1 text-xs text-white/60">Офферов</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-2xl font-bold">{dealsCount}</div>
          <div className="mt-1 text-xs text-white/60">Сделок</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <div className="text-2xl font-bold">{avgRating !== null ? avgRating.toFixed(1) : "—"}</div>
          <div className="mt-1 text-xs text-white/60">Средний рейтинг</div>
        </div>
      </div>
    </div>
  )
}
