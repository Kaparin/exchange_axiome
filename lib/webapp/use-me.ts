import { useEffect, useState } from "react"
import type { MeResult } from "./types"
import { apiGet } from "./client"

export function useMe() {
  const [me, setMe] = useState<MeResult | null>(null)

  const refresh = async () => {
    const data = await apiGet<MeResult>("/api/me")
    setMe(data)
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  return { me, refresh }
}
