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
        <h2 className="text-lg font-semibold">Кошельки/реквизиты</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
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
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={createWallet} className="rounded-lg bg-blue-600 px-3 py-2 text-xs">
            Добавить
          </button>
          <button type="button" onClick={loadWallets} className="rounded-lg bg-white/10 px-3 py-2 text-xs">
            Мои реквизиты
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Список</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {wallets.map((wallet) => (
            <li key={wallet.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
              {wallet.type} • {wallet.label || "без метки"} • {wallet.value}{" "}
              {wallet.isDefault ? "(default)" : ""}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
