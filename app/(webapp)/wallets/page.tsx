"use client"

import { useState } from "react"
import { apiGet, apiPost } from "../../../lib/webapp/client"
import type { WalletItem } from "../../../lib/webapp/types"

export default function WalletsPage() {
  const [wallets, setWallets] = useState<WalletItem[]>([])
  const [walletForm, setWalletForm] = useState({
    type: "card",
    label: "",
    value: "",
    isDefault: false,
  })
  const [showForm, setShowForm] = useState(false)

  const loadWallets = async () => {
    const data = await apiGet<{ wallets: WalletItem[] }>("/api/wallets")
    if (data?.wallets) setWallets(data.wallets)
  }

  const createWallet = async () => {
    const data = await apiPost<{ wallet?: WalletItem }>("/api/wallets", walletForm)
    if (data?.wallet) {
      setWalletForm({ type: "card", label: "", value: "", isDefault: false })
      await loadWallets()
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Реквизиты</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={loadWallets}
              className="rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              Обновить
            </button>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs"
            >
              Добавить
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Список реквизитов</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {wallets.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/60">
              Реквизиты ещё не добавлены. Нажмите «Добавить».
            </li>
          ) : (
            wallets.map((wallet) => (
              <li key={wallet.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/50">{wallet.type}</div>
                <div className="font-semibold">{wallet.label || "Без метки"}</div>
                <div className="text-xs text-white/70">{wallet.value}</div>
                {wallet.isDefault && <div className="mt-1 text-xs text-blue-300">По умолчанию</div>}
              </li>
            ))
          )}
        </ul>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1322] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Новые реквизиты</h3>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Закрыть
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={walletForm.type}
                onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value })}
                placeholder="Тип (card, bank, crypto)"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={walletForm.label}
                onChange={(e) => setWalletForm({ ...walletForm, label: e.target.value })}
                placeholder="Метка"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
                value={walletForm.value}
                onChange={(e) => setWalletForm({ ...walletForm, value: e.target.value })}
                placeholder="Реквизиты"
              />
              <label className="flex items-center gap-2 text-xs text-white/70">
                <input
                  type="checkbox"
                  checked={walletForm.isDefault}
                  onChange={(e) => setWalletForm({ ...walletForm, isDefault: e.target.checked })}
                />
                По умолчанию
              </label>
            </div>
            <button
              type="button"
              onClick={async () => {
                await createWallet()
                setShowForm(false)
              }}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium"
            >
              Сохранить
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
