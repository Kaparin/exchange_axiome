import type { Context } from "telegraf"
import { getUserOffers } from "./db"
import type { Offer, Request } from "../types"

// Check for stale deals (accepted but not completed for more than 2 hours)
export async function checkStaleDeals(ctx: Context, userId: number): Promise<void> {
  try {
    const offers = await getUserOffers(userId)
    const staleDeals: { offer: Offer; request: Request }[] = []
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000

    for (const offer of offers) {
      for (const request of offer.requests) {
        if (request.status === "accepted" && request.createdAt < twoHoursAgo) {
          staleDeals.push({ offer, request })
        }
      }
    }

    if (staleDeals.length > 0) {
      let message = "*Напоминание о незавершенных сделках*\n\n"
      message += `У вас есть ${staleDeals.length} сделок, которые ожидают завершения более 2 часов:\n\n`

      staleDeals.forEach(({ offer, request }, index) => {
        const hoursAgo = Math.floor((Date.now() - request.createdAt) / (60 * 60 * 1000))
        message += `${index + 1}. ${request.amount} ${offer.crypto} с @${request.username}\n`
        message += `   Принято ${hoursAgo} ч. назад\n\n`
      })

      message += "Пожалуйста, завершите эти сделки или отмените их, если они больше не актуальны."

      await ctx.reply(message, { parse_mode: "Markdown" })
    }
  } catch (error) {
    console.error("Error checking stale deals:", error)
  }
}

// Get pending requests count for user's offers
export async function getPendingRequestsCount(userId: number): Promise<number> {
  try {
    const offers = await getUserOffers(userId)
    let count = 0

    for (const offer of offers) {
      count += offer.requests.filter((r) => r.status === "pending").length
    }

    return count
  } catch (error) {
    console.error("Error getting pending requests count:", error)
    return 0
  }
}

// Get accepted but not completed deals count
export async function getAcceptedDealsCount(userId: number): Promise<number> {
  try {
    const offers = await getUserOffers(userId)
    let count = 0

    for (const offer of offers) {
      count += offer.requests.filter((r) => r.status === "accepted").length
    }

    return count
  } catch (error) {
    console.error("Error getting accepted deals count:", error)
    return 0
  }
}
