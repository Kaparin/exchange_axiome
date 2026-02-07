"use client"

import { useState } from "react"
import { apiGet } from "../../../lib/webapp/client"
import type { AdminStats } from "../../../lib/webapp/types"

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  const loadStats = async () => {
    const data = await apiGet<AdminStats & { ok?: boolean }>("/api/admin/stats")
    if (data?.ok) {
      setStats(data)
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">Админка</h2>
      <button type="button" onClick={loadStats} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs">
        Статистика
      </button>
      {stats && (
        <div className="mt-3 text-sm">
          Пользователи: {stats.users} • Офферы: {stats.offers} • Заявки: {stats.requests} • Транзакции:{" "}
          {stats.transactions}
        </div>
      )}
    </div>
  )
}
