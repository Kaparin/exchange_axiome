"use client"

import { useEffect, useState } from "react"
import { apiGet } from "../../../lib/webapp/client"
import type { AdminStats } from "../../../lib/webapp/types"

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  const loadStats = async () => {
    setError("")
    setLoading(true)
    try {
      const data = await apiGet<AdminStats & { ok?: boolean }>("/api/admin/stats")
      if (data?.ok) {
        setStats(data)
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки"
      if (msg.includes("403") || msg.includes("Forbidden")) {
        setError("Нет доступа. Только для администраторов.")
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
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
        </div>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Админка</h2>
          <button type="button" onClick={loadStats} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
            {loading ? "Загрузка..." : "Обновить"}
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-bold">{stats.users}</div>
            <div className="mt-1 text-xs text-white/60">Пользователей</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-bold">{stats.offers}</div>
            <div className="mt-1 text-xs text-white/60">Офферов</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-bold">{stats.requests}</div>
            <div className="mt-1 text-xs text-white/60">Заявок</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
            <div className="text-2xl font-bold">{stats.transactions}</div>
            <div className="mt-1 text-xs text-white/60">Транзакций</div>
          </div>
        </div>
      )}
    </div>
  )
}
