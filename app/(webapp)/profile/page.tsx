"use client"

import { useMe } from "../../../lib/webapp/use-me"

export default function ProfilePage() {
  const { me, refresh } = useMe()

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">Профиль</h2>
      <div className="mt-3 text-sm text-white/70">
        {me?.user ? (
          <div>
            <div>ID: {me.user.id}</div>
            <div>Telegram ID: {me.user.telegramId}</div>
            <div>Username: {me.user.username || "—"}</div>
          </div>
        ) : (
          "Сессия не найдена"
        )}
      </div>
      <button type="button" onClick={refresh} className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs">
        Обновить
      </button>
    </div>
  )
}
