"use client"

import { useEffect, useMemo, useState } from "react"
import { apiGet, apiPost, apiPatch, apiDelete } from "../../../lib/webapp/client"
import type { Offer, RequestItem } from "../../../lib/webapp/types"
import { useMe } from "../../../lib/webapp/use-me"

export default function MarketPage() {
  const { me, refresh } = useMe()
  const [offers, setOffers] = useState<Offer[]>([])
  const [offersPage, setOffersPage] = useState(1)
  const [offersTotal, setOffersTotal] = useState(0)
  const [offerFilters, setOfferFilters] = useState({
    type: "",
    status: "ACTIVE",
    crypto: "",
    network: "",
    currency: "",
    minRate: "",
    maxRate: "",
  })
  const [offerForm, setOfferForm] = useState({
    type: "SELL",
    crypto: "USDT",
    network: "TRC20",
    amount: "100",
    currency: "RUB",
    rate: "95",
    minAmount: "",
    maxAmount: "",
    paymentInfo: "",
  })
  const [showCreate, setShowCreate] = useState(false)
  const [requestAmountByOffer, setRequestAmountByOffer] = useState<Record<string, string>>({})
  const [editOfferId, setEditOfferId] = useState<string | null>(null)
  const [editOfferForm, setEditOfferForm] = useState({
    rate: "",
    minAmount: "",
    maxAmount: "",
    paymentInfo: "",
  })
  const [offerRequests, setOfferRequests] = useState<RequestItem[]>([])
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null)
  const [loadingOffers, setLoadingOffers] = useState(false)

  const isOwner = useMemo(
    () => (offer: Offer) => offer.userId && offer.userId === me?.user?.id,
    [me?.user?.id],
  )

  const loadOffers = async (pageOverride?: number) => {
    const targetPage = pageOverride ?? offersPage
    const params = new URLSearchParams()
    Object.entries(offerFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    params.set("page", String(targetPage))
    params.set("pageSize", "20")

    setLoadingOffers(true)
    const data = await apiGet<{ offers: Offer[]; total: number }>(`/api/offers?${params.toString()}`)
    if (data?.offers) {
      setOffers(data.offers)
      setOffersTotal(data.total || 0)
    }
    setLoadingOffers(false)
  }

  const createOffer = async () => {
    const data = await apiPost<{ offer?: Offer }>("/api/offers", {
      ...offerForm,
      amount: Number(offerForm.amount),
      rate: Number(offerForm.rate),
      minAmount: offerForm.minAmount ? Number(offerForm.minAmount) : undefined,
      maxAmount: offerForm.maxAmount ? Number(offerForm.maxAmount) : undefined,
      paymentInfo: offerForm.paymentInfo || undefined,
    })
    if (data?.offer) {
      setShowCreate(false)
      await loadOffers()
    }
  }

  const createRequest = async (offerId: string) => {
    const amount = Number(requestAmountByOffer[offerId] || 0)
    if (!amount || amount <= 0) return
    const data = await apiPost<{ request?: RequestItem }>("/api/requests", {
      offerId,
      amount,
    })
    if (data?.request) {
      setRequestAmountByOffer((prev) => ({ ...prev, [offerId]: "" }))
      await loadOffers()
    }
  }

  const startEditOffer = (offer: Offer) => {
    setEditOfferId(offer.id)
    setEditOfferForm({
      rate: String(offer.rate ?? ""),
      minAmount: offer.minAmount !== null && offer.minAmount !== undefined ? String(offer.minAmount) : "",
      maxAmount: offer.maxAmount !== null && offer.maxAmount !== undefined ? String(offer.maxAmount) : "",
      paymentInfo: offer.paymentInfo || "",
    })
  }

  const saveOffer = async (offerId: string) => {
    const data = await apiPatch<{ offer?: Offer }>(`/api/offers/${offerId}`, {
      rate: editOfferForm.rate ? Number(editOfferForm.rate) : undefined,
      minAmount: editOfferForm.minAmount ? Number(editOfferForm.minAmount) : undefined,
      maxAmount: editOfferForm.maxAmount ? Number(editOfferForm.maxAmount) : undefined,
      paymentInfo: editOfferForm.paymentInfo || undefined,
    })
    if (data?.offer) {
      setEditOfferId(null)
      await loadOffers()
    }
  }

  const closeOffer = async (offerId: string) => {
    const data = await apiDelete<{ offer?: Offer }>(`/api/offers/${offerId}`)
    if (data?.offer) {
      await loadOffers()
    }
  }

  const loadOfferRequests = async (offerId: string) => {
    setActiveOfferId(offerId)
    const data = await apiGet<{ requests: RequestItem[] }>(`/api/requests?offerId=${offerId}`)
    if (data?.requests) setOfferRequests(data.requests)
  }

  const updateRequestStatus = async (id: string, action: "accept" | "reject" | "complete") => {
    const data = await apiPost<{ request?: RequestItem }>(`/api/requests/${id}/${action}`)
    if (data?.request && activeOfferId) {
      await loadOfferRequests(activeOfferId)
    }
  }

  const resetFilters = () => {
    setOfferFilters({
      type: "",
      status: "ACTIVE",
      crypto: "",
      network: "",
      currency: "",
      minRate: "",
      maxRate: "",
    })
    setOffersPage(1)
  }

  useEffect(() => {
    loadOffers().catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold">Сессия</h2>
        <p className="mt-2 text-xs text-white/60">
          {me?.user ? `Пользователь: ${me.user.username || me.user.telegramId}` : "Сессия не найдена"}
        </p>
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-3 inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs"
        >
          Обновить
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Фильтры</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(offerFilters).map(([key, value]) => (
              <input
                key={key}
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={value}
                onChange={(e) => setOfferFilters({ ...offerFilters, [key]: e.target.value })}
                placeholder={key}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadOffers()}
              className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              Обновить список
            </button>
          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs"
          >
            Сбросить фильтры
          </button>
            <button
              type="button"
              onClick={() => {
                const nextPage = Math.max(1, offersPage - 1)
                setOffersPage(nextPage)
                loadOffers(nextPage)
              }}
              className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              Назад
            </button>
            <button
              type="button"
              onClick={() => {
                const nextPage = offersPage + 1
                setOffersPage(nextPage)
                loadOffers(nextPage)
              }}
              className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs"
            >
              Вперед
            </button>
            <span className="text-xs text-white/50">
              Страница {offersPage} • Всего: {offersTotal}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Быстрые действия</h2>
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium"
          >
            Создать оффер
          </button>
          <p className="mt-3 text-xs text-white/60">
            Отклик на оффер — прямо в карточке без копирования ID.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Офферы</h2>
          {loadingOffers && <div className="text-xs text-white/60">Загрузка...</div>}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {offers.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Нет офферов. Попробуйте изменить фильтры или создать новый.
            </div>
          ) : (
            offers.map((offer) => (
              <div key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>{offer.type}</span>
                  <span>{offer.status || "ACTIVE"}</span>
                </div>
                <div className="mt-2 text-lg font-semibold">
                  {offer.amount} {offer.crypto}
                </div>
                <div className="text-sm text-white/70">
                  {offer.rate} {offer.currency} • {offer.network}
                </div>
                <div className="mt-2 text-xs text-white/50">
                  Осталось: {offer.remaining} • Заявок: {offer._count?.requests || 0}
                </div>
                {offer.paymentInfo && <div className="mt-2 text-xs text-white/50">Оплата: {offer.paymentInfo}</div>}

                {!isOwner(offer) ? (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
                      value={requestAmountByOffer[offer.id] || ""}
                      onChange={(e) => setRequestAmountByOffer((prev) => ({ ...prev, [offer.id]: e.target.value }))}
                      placeholder="Сумма"
                    />
                    <button
                      type="button"
                      onClick={() => createRequest(offer.id)}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-xs"
                    >
                      Откликнуться
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => loadOfferRequests(offer.id)}
                      className="rounded-lg bg-white/10 px-3 py-2"
                    >
                      Заявки
                    </button>
                    <button
                      type="button"
                      onClick={() => startEditOffer(offer)}
                      className="rounded-lg bg-white/10 px-3 py-2"
                    >
                      Редактировать
                    </button>
                    <button
                      type="button"
                      onClick={() => closeOffer(offer.id)}
                      className="rounded-lg bg-red-500/80 px-3 py-2"
                    >
                      Закрыть
                    </button>
                  </div>
                )}

                {isOwner(offer) && editOfferId === offer.id && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <input
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      value={editOfferForm.rate}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, rate: e.target.value })}
                      placeholder="Rate"
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      value={editOfferForm.minAmount}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, minAmount: e.target.value })}
                      placeholder="Min"
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      value={editOfferForm.maxAmount}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, maxAmount: e.target.value })}
                      placeholder="Max"
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                      value={editOfferForm.paymentInfo}
                      onChange={(e) => setEditOfferForm({ ...editOfferForm, paymentInfo: e.target.value })}
                      placeholder="Payment info"
                    />
                    <button
                      type="button"
                      onClick={() => saveOffer(offer.id)}
                      className="col-span-2 rounded-lg bg-blue-600 px-3 py-2 text-xs"
                    >
                      Сохранить
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {activeOfferId && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h3 className="text-md font-semibold">Заявки по офферу</h3>
          <div className="text-xs text-white/50">{activeOfferId}</div>
          <ul className="mt-3 space-y-2 text-sm">
            {offerRequests.map((request) => {
              const isOwner = request.offer.userId === me?.user?.id
              const isRequester = request.userId === me?.user?.id
              return (
                <li key={request.id} className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="text-xs text-white/50">{request.id}</div>
                  <div className="text-sm font-semibold">
                    {request.amount} {request.offer.crypto} @ {request.offer.rate} {request.offer.currency}
                  </div>
                  <div className="text-xs text-white/50">{request.status}</div>
                  <div className="mt-2 flex gap-2">
                    {isOwner && request.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(request.id, "accept")}
                          className="rounded-lg bg-green-600 px-3 py-1 text-xs"
                        >
                          Принять
                        </button>
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(request.id, "reject")}
                          className="rounded-lg bg-red-600 px-3 py-1 text-xs"
                        >
                          Отклонить
                        </button>
                      </>
                    )}
                    {(isOwner || isRequester) && request.status === "ACCEPTED" && (
                      <button
                        type="button"
                        onClick={() => updateRequestStatus(request.id, "complete")}
                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs"
                      >
                        Завершить
                      </button>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b1322] p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Новый оффер</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-xs text-white/60 hover:text-white"
              >
                Закрыть
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.type}
                onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
                placeholder="BUY/SELL"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.crypto}
                onChange={(e) => setOfferForm({ ...offerForm, crypto: e.target.value })}
                placeholder="USDT"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.network}
                onChange={(e) => setOfferForm({ ...offerForm, network: e.target.value })}
                placeholder="TRC20"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.amount}
                onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                placeholder="Amount"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.currency}
                onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
                placeholder="RUB"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.rate}
                onChange={(e) => setOfferForm({ ...offerForm, rate: e.target.value })}
                placeholder="Rate"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.minAmount}
                onChange={(e) => setOfferForm({ ...offerForm, minAmount: e.target.value })}
                placeholder="Min"
              />
              <input
                className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.maxAmount}
                onChange={(e) => setOfferForm({ ...offerForm, maxAmount: e.target.value })}
                placeholder="Max"
              />
              <input
                className="col-span-2 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                value={offerForm.paymentInfo}
                onChange={(e) => setOfferForm({ ...offerForm, paymentInfo: e.target.value })}
                placeholder="Реквизиты/оплата"
              />
            </div>
            <button
              type="button"
              onClick={createOffer}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium"
            >
              Создать оффер
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
