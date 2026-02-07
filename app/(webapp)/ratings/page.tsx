"use client"

import { useState } from "react"
import { apiPost } from "../../../lib/webapp/client"

export default function RatingsPage() {
  const [ratingForm, setRatingForm] = useState({
    transactionId: "",
    score: "5",
    comment: "",
  })

  const createRating = async () => {
    const data = await apiPost<{ rating?: unknown }>("/api/ratings", {
      transactionId: ratingForm.transactionId,
      score: Number(ratingForm.score),
      comment: ratingForm.comment,
    })
    if (data?.rating) {
      setRatingForm({ transactionId: "", score: "5", comment: "" })
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-lg font-semibold">Оценка сделки</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <input
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
          value={ratingForm.transactionId}
          onChange={(e) => setRatingForm({ ...ratingForm, transactionId: e.target.value })}
          placeholder="Transaction ID"
        />
        <input
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white"
          value={ratingForm.score}
          onChange={(e) => setRatingForm({ ...ratingForm, score: e.target.value })}
          placeholder="Score 1-5"
        />
        <input
          className="rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-white col-span-2"
          value={ratingForm.comment}
          onChange={(e) => setRatingForm({ ...ratingForm, comment: e.target.value })}
          placeholder="Комментарий"
        />
      </div>
      <button type="button" onClick={createRating} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs">
        Оценить
      </button>
    </div>
  )
}
