"use client"

import { useState } from "react"
import { apiGet, apiPatch } from "../../../lib/webapp/client"
import type { NotificationItem } from "../../../lib/webapp/types"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const loadNotifications = async () => {
    const data = await apiGet<{ notifications: NotificationItem[] }>("/api/notifications")
    if (data?.notifications) setNotifications(data.notifications)
  }

  const markRead = async () => {
    await apiPatch("/api/notifications")
    await loadNotifications()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Уведомления</h2>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={loadNotifications} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
            Обновить
          </button>
          <button type="button" onClick={markRead} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
            Пометить прочитанными
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <ul className="mt-4 space-y-2 text-sm">
          {notifications.map((n) => (
            <li key={n.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="font-medium">{n.title}</div>
              <div className="text-xs text-white/60">{n.type}</div>
              <div className="text-xs text-white/60">{n.body}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
