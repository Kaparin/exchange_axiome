"use client"

import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    // Сохраняем hash (содержит tgWebAppData от Telegram) при редиректе
    window.location.replace("/market" + window.location.hash)
  }, [])

  return null
}
