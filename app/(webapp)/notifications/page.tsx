"use client"

import { useEffect, useState } from "react"
import { apiGet, apiPatch } from "../../../lib/webapp/client"
import type { NotificationItem } from "../../../lib/webapp/types"

const typeLabels: Record<string, string> = {
  request_created: "Новая заявка",
  request_accepted: "Заявка принята",
  request_rejected: "Заявка отклонена",
  request_completed: "Сделка завершена",
  system: "Системное",
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [error, setError] = useState("")

  const loadNotifications = async () => {
    setError("")
    try {
      const data = await apiGet<{ notifications: NotificationItem[] }>("/api/notifications")
      if (data?.notifications) setNotifications(data.notifications)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки уведомлений")
    }
  }

  const markRead = async () => {
    setError("")
    try {
      await apiPatch("/api/notifications")
      await loadNotifications()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка")
    }
  }

  useEffect(() => {
    loadNotifications().catch(() => {})
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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Уведомления</h2>
          <div className="flex gap-2">
            <button type="button" onClick={loadNotifications} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
              Обновить
            </button>
            <button type="button" onClick={markRead} className="rounded-lg bg-blue-600 px-3 py-2 text-xs">
              Прочитать все
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <ul className="space-y-2 text-sm">
          {notifications.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
              Пока нет уведомлений.
            </li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={`rounded-xl border p-3 ${
                  n.readAt
                    ? "border-white/10 bg-white/5"
                    : "border-blue-500/30 bg-blue-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-white/40">
                    {new Date(n.createdAt).toLocaleString("ru-RU")}
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {typeLabels[n.type] || n.type}
                </div>
                {n.body && <div className="mt-1 text-xs text-white/60">{n.body}</div>}
                {!n.readAt && (
                  <div className="mt-1 text-xs text-blue-300">Новое</div>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
