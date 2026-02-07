"use client"

import { useEffect, useState } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../../../lib/webapp/client"
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
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    label: "",
    value: "",
    isDefault: false,
  })

  const loadWallets = async () => {
    setError("")
    try {
      const data = await apiGet<{ wallets: WalletItem[] }>("/api/wallets")
      if (data?.wallets) setWallets(data.wallets)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки реквизитов")
    }
  }

  const createWallet = async () => {
    if (!walletForm.value.trim()) {
      setError("Укажите реквизиты"); return
    }
    setSubmitting(true)
    setError("")
    try {
      const data = await apiPost<{ wallet?: WalletItem }>("/api/wallets", walletForm)
      if (data?.wallet) {
        setWalletForm({ type: "card", label: "", value: "", isDefault: false })
        setShowForm(false)
        await loadWallets()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка создания реквизитов")
    } finally {
      setSubmitting(false)
    }
  }

  const startEdit = (wallet: WalletItem) => {
    setEditId(wallet.id)
    setEditForm({
      label: wallet.label || "",
      value: wallet.value,
      isDefault: wallet.isDefault,
    })
  }

  const saveEdit = async () => {
    if (!editId) return
    if (!editForm.value.trim()) {
      setError("Укажите реквизиты"); return
    }
    setSubmitting(true)
    setError("")
    try {
      const data = await apiPatch<{ wallet?: WalletItem }>(`/api/wallets/${editId}`, editForm)
      if (data?.wallet) {
        setEditId(null)
        await loadWallets()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setSubmitting(false)
    }
  }

  const deleteWallet = async (id: string) => {
    setSubmitting(true)
    setError("")
    try {
      await apiDelete(`/api/wallets/${id}`)
      await loadWallets()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка удаления")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadWallets().catch(() => {})
  }, [])

  const selectClass = "rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"

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
                {editId === wallet.id ? (
                  <div className="space-y-2">
                    <input
                      className={selectClass + " w-full text-sm"}
                      value={editForm.label}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      placeholder="Метка"
                    />
                    <input
                      className={selectClass + " w-full text-sm"}
                      value={editForm.value}
                      onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                      placeholder="Реквизиты"
                    />
                    <label className="flex items-center gap-2 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={editForm.isDefault}
                        onChange={(e) => setEditForm({ ...editForm, isDefault: e.target.checked })}
                      />
                      По умолчанию
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={submitting}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs disabled:opacity-50"
                      >
                        {submitting ? "..." : "Сохранить"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditId(null)}
                        className="rounded-lg bg-white/10 px-3 py-1 text-xs"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-xs text-white/50">{wallet.type}</div>
                    <div className="font-semibold">{wallet.label || "Без метки"}</div>
                    <div className="text-xs text-white/70">{wallet.value}</div>
                    {wallet.isDefault && <div className="mt-1 text-xs text-blue-300">По умолчанию</div>}
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(wallet)}
                        className="rounded-lg bg-white/10 px-3 py-1 text-xs"
                      >
                        Редактировать
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWallet(wallet.id)}
                        disabled={submitting}
                        className="rounded-lg bg-red-500/80 px-3 py-1 text-xs disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </>
                )}
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
              <select
                className={selectClass}
                value={walletForm.type}
                onChange={(e) => setWalletForm({ ...walletForm, type: e.target.value })}
              >
                <option value="card">Карта</option>
                <option value="bank">Счёт</option>
                <option value="crypto">Крипто</option>
                <option value="sbp">СБП</option>
              </select>
              <input
                className={selectClass}
                value={walletForm.label}
                onChange={(e) => setWalletForm({ ...walletForm, label: e.target.value })}
                placeholder="Метка"
              />
              <input
                className={selectClass + " col-span-2"}
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
              onClick={createWallet}
              disabled={submitting}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
