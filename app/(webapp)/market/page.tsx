"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
  const [showFilters, setShowFilters] = useState(true)
  const [showQuick, setShowQuick] = useState(true)
  const [showOffers, setShowOffers] = useState(true)
  const [showRequests, setShowRequests] = useState(true)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

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
    setError("")
    try {
      const data = await apiGet<{ offers: Offer[]; total: number }>(`/api/offers?${params.toString()}`)
      setOffers(data.offers || [])
      setOffersTotal(data.total || 0)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки офферов"
      setError(msg)
    } finally {
      setLoadingOffers(false)
    }
  }

  const applyQuickOffer = (overrides: Partial<typeof offerForm>) => {
    setOfferForm((prev) => ({ ...prev, ...overrides }))
    setShowCreate(true)
  }

  const createOffer = async () => {
    const amount = Number(offerForm.amount)
    const rate = Number(offerForm.rate)
    const minAmount = offerForm.minAmount ? Number(offerForm.minAmount) : undefined
    const maxAmount = offerForm.maxAmount ? Number(offerForm.maxAmount) : undefined

    if (!offerForm.type || !offerForm.crypto || !offerForm.network || !offerForm.currency) {
      setError("Заполните все обязательные поля"); return
    }
    if (!amount || amount <= 0) { setError("Сумма должна быть больше 0"); return }
    if (!rate || rate <= 0) { setError("Курс должен быть больше 0"); return }
    if (minAmount !== undefined && maxAmount !== undefined && minAmount > maxAmount) {
      setError("Мин. сумма не может быть больше макс."); return
    }

    setSubmitting(true)
    setError("")
    try {
      const data = await apiPost<{ offer?: Offer }>("/api/offers", {
        type: offerForm.type,
        crypto: offerForm.crypto,
        network: offerForm.network,
        currency: offerForm.currency,
        amount,
        rate,
        minAmount: minAmount || undefined,
        maxAmount: maxAmount || undefined,
        paymentInfo: offerForm.paymentInfo || undefined,
      })
      if (data?.offer) {
        setShowCreate(false)
        setOfferForm({ type: "SELL", crypto: "USDT", network: "TRC20", amount: "100", currency: "RUB", rate: "95", minAmount: "", maxAmount: "", paymentInfo: "" })
        await loadOffers(1)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка создания оффера")
    } finally {
      setSubmitting(false)
    }
  }

  const createRequest = async (offerId: string) => {
    const amount = Number(requestAmountByOffer[offerId] || 0)
    if (!amount || amount <= 0) { setError("Укажите сумму заявки"); return }

    const offer = offers.find((o) => o.id === offerId)
    if (offer) {
      if (offer.minAmount && amount < offer.minAmount) {
        setError(`Минимальная сумма: ${offer.minAmount}`); return
      }
      if (offer.maxAmount && amount > offer.maxAmount) {
        setError(`Максимальная сумма: ${offer.maxAmount}`); return
      }
      if (amount > offer.remaining) {
        setError(`Доступно: ${offer.remaining}`); return
      }
    }

    setSubmitting(true)
    setError("")
    try {
      const data = await apiPost<{ request?: RequestItem }>("/api/requests", {
        offerId,
        amount,
      })
      if (data?.request) {
        setRequestAmountByOffer((prev) => ({ ...prev, [offerId]: "" }))
        await loadOffers()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка создания заявки")
    } finally {
      setSubmitting(false)
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
    setSubmitting(true)
    setError("")
    try {
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
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setSubmitting(false)
    }
  }

  const closeOffer = async (offerId: string) => {
    setSubmitting(true)
    setError("")
    try {
      const data = await apiDelete<{ offer?: Offer }>(`/api/offers/${offerId}`)
      if (data?.offer) {
        await loadOffers()
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка закрытия оффера")
    } finally {
      setSubmitting(false)
    }
  }

  const loadOfferRequests = async (offerId: string) => {
    setActiveOfferId(offerId)
    setError("")
    try {
      const data = await apiGet<{ requests: RequestItem[] }>(`/api/requests?offerId=${offerId}`)
      if (data?.requests) setOfferRequests(data.requests)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки заявок")
    }
  }

  const updateRequestStatus = async (id: string, action: "accept" | "reject" | "complete") => {
    setSubmitting(true)
    setError("")
    try {
      const data = await apiPost<{ request?: RequestItem }>(`/api/requests/${id}/${action}`)
      if (data?.request && activeOfferId) {
        await loadOfferRequests(activeOfferId)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Ошибка обновления статуса")
    } finally {
      setSubmitting(false)
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

  const applyFilters = () => {
    setOffersPage(1)
    loadOffers(1)
  }

  useEffect(() => {
    loadOffers().catch(() => {})
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

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <button
            type="button"
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">Фильтры</h2>
            <span className="text-xs text-white/60">{showFilters ? "Скрыть" : "Показать"}</span>
          </button>
          {showFilters && (
            <>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <select
                  className={selectClass}
                  value={offerFilters.type}
                  onChange={(e) => setOfferFilters({ ...offerFilters, type: e.target.value })}
                >
                  <option value="">Тип</option>
                  <option value="BUY">Покупка</option>
                  <option value="SELL">Продажа</option>
                </select>
                <select
                  className={selectClass}
                  value={offerFilters.status}
                  onChange={(e) => setOfferFilters({ ...offerFilters, status: e.target.value })}
                >
                  <option value="">Статус</option>
                  <option value="ACTIVE">Активные</option>
                  <option value="CLOSED">Закрытые</option>
                </select>
                <select
                  className={selectClass}
                  value={offerFilters.crypto}
                  onChange={(e) => setOfferFilters({ ...offerFilters, crypto: e.target.value })}
                >
                  <option value="">Крипта</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                </select>
                <select
                  className={selectClass}
                  value={offerFilters.network}
                  onChange={(e) => setOfferFilters({ ...offerFilters, network: e.target.value })}
                >
                  <option value="">Сеть</option>
                  <option value="TRC20">TRC20</option>
                  <option value="ERC20">ERC20</option>
                  <option value="BEP20">BEP20</option>
                </select>
                <select
                  className={selectClass}
                  value={offerFilters.currency}
                  onChange={(e) => setOfferFilters({ ...offerFilters, currency: e.target.value })}
                >
                  <option value="">Валюта</option>
                  <option value="RUB">RUB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    className={selectClass}
                    value={offerFilters.minRate}
                    onChange={(e) => setOfferFilters({ ...offerFilters, minRate: e.target.value })}
                    placeholder="Мин. курс"
                  />
                  <input
                    className={selectClass}
                    value={offerFilters.maxRate}
                    onChange={(e) => setOfferFilters({ ...offerFilters, maxRate: e.target.value })}
                    placeholder="Макс. курс"
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={applyFilters}
                  className="inline-flex items-center rounded-lg bg-white/10 px-3 py-2 text-xs"
                >
                  Применить
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
            </>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <button
            type="button"
            onClick={() => setShowQuick((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <h2 className="text-lg font-semibold">Быстрые действия</h2>
            <span className="text-xs text-white/60">{showQuick ? "Скрыть" : "Показать"}</span>
          </button>
          {showQuick && (
            <>
              <div className="mt-4 grid gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    applyQuickOffer({ type: "BUY", crypto: "USDT", network: "TRC20", currency: "RUB" })
                  }
                  className="rounded-lg bg-white/10 px-3 py-2 text-left"
                >
                  Купить USDT за RUB (TRC20)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    applyQuickOffer({ type: "SELL", crypto: "USDT", network: "TRC20", currency: "RUB" })
                  }
                  className="rounded-lg bg-white/10 px-3 py-2 text-left"
                >
                  Продать USDT за RUB (TRC20)
                </button>
              </div>
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
            </>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <button
          type="button"
          onClick={() => setShowOffers((prev) => !prev)}
          className="flex w-full items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Офферы</h2>
            {loadingOffers && <div className="text-xs text-white/60">Загрузка...</div>}
          </div>
          <span className="text-xs text-white/60">{showOffers ? "Скрыть" : "Показать"}</span>
        </button>
        {showOffers && (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {offers.length === 0 && !loadingOffers ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
                Нет офферов. Попробуйте изменить фильтры или создать новый.
              </div>
            ) : (
              offers.map((offer) => (
                <div key={offer.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs text-white/60">
                    <span>{offer.type === "BUY" ? "Покупка" : "Продажа"}</span>
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
                  {(offer.minAmount || offer.maxAmount) && (
                    <div className="mt-1 text-xs text-white/50">
                      Лимиты: {offer.minAmount ?? "—"} – {offer.maxAmount ?? "—"}
                    </div>
                  )}
                  {offer.paymentInfo && <div className="mt-2 text-xs text-white/50">Оплата: {offer.paymentInfo}</div>}
                  <div className="mt-3">
                    <Link href={`/market/${offer.id}`} className="text-xs text-blue-300 hover:text-blue-200">
                      Детали оффера
                    </Link>
                  </div>

                  {!isOwner(offer) ? (
                    <div className="mt-3 flex items-center gap-2">
                      <input
                        className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-xs text-white"
                        value={requestAmountByOffer[offer.id] || ""}
                        onChange={(e) =>
                          setRequestAmountByOffer((prev) => ({ ...prev, [offer.id]: e.target.value }))
                        }
                        placeholder={`Сумма${offer.minAmount ? ` (от ${offer.minAmount})` : ""}`}
                      />
                      <button
                        type="button"
                        onClick={() => createRequest(offer.id)}
                        disabled={submitting}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {submitting ? "..." : "Откликнуться"}
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
                        disabled={submitting}
                        className="rounded-lg bg-red-500/80 px-3 py-2 disabled:opacity-50"
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
                        disabled={submitting}
                        className="col-span-2 rounded-lg bg-blue-600 px-3 py-2 text-xs disabled:opacity-50"
                      >
                        {submitting ? "Сохранение..." : "Сохранить"}
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeOfferId && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <button
            type="button"
            onClick={() => setShowRequests((prev) => !prev)}
            className="flex w-full items-center justify-between text-left"
          >
            <div>
              <h3 className="text-md font-semibold">Заявки по офферу</h3>
              <div className="text-xs text-white/50">{activeOfferId}</div>
            </div>
            <span className="text-xs text-white/60">{showRequests ? "Скрыть" : "Показать"}</span>
          </button>
          {showRequests && (
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
                            disabled={submitting}
                            className="rounded-lg bg-green-600 px-3 py-1 text-xs disabled:opacity-50"
                          >
                            Принять
                          </button>
                          <button
                            type="button"
                            onClick={() => updateRequestStatus(request.id, "reject")}
                            disabled={submitting}
                            className="rounded-lg bg-red-600 px-3 py-1 text-xs disabled:opacity-50"
                          >
                            Отклонить
                          </button>
                        </>
                      )}
                      {(isOwner || isRequester) && request.status === "ACCEPTED" && (
                        <button
                          type="button"
                          onClick={() => updateRequestStatus(request.id, "complete")}
                          disabled={submitting}
                          className="rounded-lg bg-blue-600 px-3 py-1 text-xs disabled:opacity-50"
                        >
                          Завершить
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
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
            {error && (
              <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <select
                className={selectClass}
                value={offerForm.type}
                onChange={(e) => setOfferForm({ ...offerForm, type: e.target.value })}
              >
                <option value="BUY">Покупка</option>
                <option value="SELL">Продажа</option>
              </select>
              <select
                className={selectClass}
                value={offerForm.crypto}
                onChange={(e) => setOfferForm({ ...offerForm, crypto: e.target.value })}
              >
                <option value="USDT">USDT</option>
                <option value="BTC">BTC</option>
                <option value="ETH">ETH</option>
              </select>
              <select
                className={selectClass}
                value={offerForm.network}
                onChange={(e) => setOfferForm({ ...offerForm, network: e.target.value })}
              >
                <option value="TRC20">TRC20</option>
                <option value="ERC20">ERC20</option>
                <option value="BEP20">BEP20</option>
              </select>
              <input
                className={selectClass}
                value={offerForm.amount}
                onChange={(e) => setOfferForm({ ...offerForm, amount: e.target.value })}
                placeholder="Сумма"
              />
              <select
                className={selectClass}
                value={offerForm.currency}
                onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value })}
              >
                <option value="RUB">RUB</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
              <input
                className={selectClass}
                value={offerForm.rate}
                onChange={(e) => setOfferForm({ ...offerForm, rate: e.target.value })}
                placeholder="Курс"
              />
              <input
                className={selectClass}
                value={offerForm.minAmount}
                onChange={(e) => setOfferForm({ ...offerForm, minAmount: e.target.value })}
                placeholder="Мин. сумма"
              />
              <input
                className={selectClass}
                value={offerForm.maxAmount}
                onChange={(e) => setOfferForm({ ...offerForm, maxAmount: e.target.value })}
                placeholder="Макс. сумма"
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
              disabled={submitting}
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {submitting ? "Создание..." : "Создать оффер"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
