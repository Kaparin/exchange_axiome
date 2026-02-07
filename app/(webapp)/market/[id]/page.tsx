 "use client"
 
 import { useEffect, useMemo, useState } from "react"
 import Link from "next/link"
 import { apiGet, apiPost, apiDelete } from "../../../../lib/webapp/client"
 import type { Offer, RequestItem } from "../../../../lib/webapp/types"
 import { useMe } from "../../../../lib/webapp/use-me"
 
 type PageProps = {
   params: { id: string }
 }
 
 export default function OfferDetailsPage({ params }: PageProps) {
   const { me } = useMe()
   const [offer, setOffer] = useState<Offer | null>(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState("")
   const [requestAmount, setRequestAmount] = useState("")
 
   const isOwner = useMemo(() => offer?.userId && offer.userId === me?.user?.id, [offer?.userId, me?.user?.id])
 
   const loadOffer = async () => {
     setLoading(true)
     const data = await apiGet<{ offer?: Offer }>(`/api/offers/${params.id}`)
     if (data?.offer) {
       setOffer(data.offer)
       setError("")
     } else {
       setError("Оффер не найден")
     }
     setLoading(false)
   }
 
   const createRequest = async () => {
     const amount = Number(requestAmount || 0)
     if (!amount || amount <= 0 || !offer) return
     const data = await apiPost<{ request?: RequestItem }>("/api/requests", {
       offerId: offer.id,
       amount,
     })
     if (data?.request) {
       setRequestAmount("")
       await loadOffer()
     }
   }
 
   const closeOffer = async () => {
     if (!offer) return
     const data = await apiDelete<{ offer?: Offer }>(`/api/offers/${offer.id}`)
     if (data?.offer) {
       await loadOffer()
     }
   }
 
   useEffect(() => {
     loadOffer().catch(() => setError("Ошибка загрузки оффера"))
   }, [])
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <Link href="/market" className="text-xs text-white/60 hover:text-white">
           ← Назад к списку
         </Link>
         {loading && <div className="text-xs text-white/60">Загрузка...</div>}
       </div>
 
       {error && (
         <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">{error}</div>
       )}
 
       {offer && (
         <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
           <div className="flex items-center justify-between text-xs text-white/60">
             <span>{offer.type}</span>
             <span>{offer.status || "ACTIVE"}</span>
           </div>
           <div className="mt-2 text-2xl font-semibold">
             {offer.amount} {offer.crypto}
           </div>
           <div className="text-sm text-white/70">
             {offer.rate} {offer.currency} • {offer.network}
           </div>
           <div className="mt-2 text-xs text-white/50">
             Осталось: {offer.remaining} • Заявок: {offer._count?.requests || 0}
           </div>
           {offer.paymentInfo && <div className="mt-3 text-xs text-white/60">Оплата: {offer.paymentInfo}</div>}
 
           {!isOwner ? (
             <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
               <input
                 className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
                 value={requestAmount}
                 onChange={(e) => setRequestAmount(e.target.value)}
                 placeholder="Сумма отклика"
               />
               <button
                 type="button"
                 onClick={createRequest}
                 className="rounded-lg bg-blue-600 px-3 py-2 text-xs"
               >
                 Откликнуться
               </button>
             </div>
           ) : (
             <div className="mt-4 flex flex-wrap gap-2 text-xs">
               <button type="button" onClick={closeOffer} className="rounded-lg bg-red-500/80 px-3 py-2">
                 Закрыть оффер
               </button>
             </div>
           )}
         </div>
       )}
     </div>
   )
 }
