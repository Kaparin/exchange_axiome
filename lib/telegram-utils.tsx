import { Markup } from "telegraf"
import type { Context } from "telegraf"
import type { Message } from "telegraf/typings/core/types/typegram"
import type { Offer, Request, Transaction, RequestStatus } from "../types"
import { createOffer, clearUserState, getUserSettings, updateOffer, getUserRating } from "./db"
import { isUserMemberOfGroup } from "./groups"
import { config } from "./config"
import { getUserBadges, formatBadges } from "./badges"

// Main keyboard
export const mainKeyboard = Markup.keyboard([
  ["💸 Продать крипту", "🛒 Купить крипту"],
  ["🔁 Быстрое объявление"],
  ["📃 Мои объявления", "📋 Мои заявки"],
  ["📊 История сделок", "👥 Рейтинг"],
  ["⭐ Избранные", "📈 Курсы криптовалют"],
  ["🔄 Выбрать группу", "💰 Поддержать проект"],
  ["⚙️ Настройки", "❓ Помощь"],
]).resize()

// Crypto selection keyboard
export function getCryptoKeyboard() {
  const buttons = []
  const cryptos = config.cryptocurrencies.map((c) => c.code)

  // Split into rows of 3 buttons
  for (let i = 0; i < cryptos.length; i += 3) {
    const row = cryptos.slice(i, i + 3)
    buttons.push(row)
  }

  buttons.push(["Другое", "Отмена"])
  return Markup.keyboard(buttons).oneTime().resize()
}

// Network selection keyboard
export function getNetworkKeyboard(crypto: string) {
  const networks = config.networks[crypto] || []
  const buttons = []

  for (let i = 0; i < networks.length; i += 3) {
    const row = networks.slice(i, i + 3)
    buttons.push(row)
  }

  buttons.push(["Другое", "Отмена"])
  return Markup.keyboard(buttons).oneTime().resize()
}

// Currency selection keyboard
export const currencyKeyboard = Markup.keyboard([config.currencies.slice(0, 3), ["Другое", "Отмена"]])
  .oneTime()
  .resize()

// Payment method selection keyboard
export function getPaymentMethodKeyboard(currency: string) {
  const methods = config.paymentMethods[currency] || ["Другое"]
  const buttons = []

  for (let i = 0; i < methods.length; i += 3) {
    const row = methods.slice(i, i + 3)
    buttons.push(row)
  }

  buttons.push(["Пропустить", "Отмена"])
  return Markup.keyboard(buttons).oneTime().resize()
}

// Yes/No keyboard
export const yesNoKeyboard = Markup.keyboard([["Да", "Нет"]])
  .oneTime()
  .resize()

// Cancel keyboard
export const cancelKeyboard = Markup.keyboard([["Отмена"]])
  .oneTime()
  .resize()

// Skip keyboard
export const skipKeyboard = Markup.keyboard([["Пропустить", "Отмена"]])
  .oneTime()
  .resize()

// Confirm keyboard
export const confirmKeyboard = Markup.keyboard([["✅ Подтвердить", "Отмена"]])
  .oneTime()
  .resize()

// Bybit rate keyboard
export const bybitRateKeyboard = Markup.keyboard([["📊 Использовать курс биржи Bybit"], ["Отмена"]])
  .oneTime()
  .resize()

// Rate adjustment keyboard
export function getRateAdjustmentKeyboard(rate: number, currency: string) {
  return Markup.keyboard([
    [`✅ Оставить курс ${rate} ${currency}`],
    [`📈 +5% (${(rate * 1.05).toFixed(2)} ${currency})`],
    [`📉 -5% (${(rate * 0.95).toFixed(2)} ${currency})`],
    ["🔢 Ввести свой курс"],
    ["Отмена"],
  ])
    .oneTime()
    .resize()
}

export function formatOfferMessage(offer: Offer): string {
  try {
    if (!offer) {
      console.error("Invalid offer data")
      return "Ошибка форматирования объявления"
    }

    const isSell = offer.type === "sell"
    const typeEmoji = isSell ? "💸" : "🛒"
    const typeText = isSell ? "ПРОДАЖА" : "ПОКУПКА"
    const statusEmoji = offer.status === "active" ? "🟢" : "🔴"

    let message = ""

    // Check if user has sponsor badge
    if (offer.userRating && offer.userRating.donatedAmount && offer.userRating.donatedAmount > 0) {
      const badges = getUserBadges(offer.userRating)
      const sponsorBadge = badges.find((b) => b.id.startsWith("sponsor_"))

      if (sponsorBadge) {
        message += `${sponsorBadge.icon} <b>${sponsorBadge.name}</b>\n`
      }
    }

    message += `${typeEmoji} <b>${typeText}</b> ${statusEmoji} • <b>💎 ${offer.crypto}</b> <code>${offer.network}</code>\n`
    message += `━━━━━━━━━━━━━━━━━━━━━\n`

    const percentRemaining = (offer.remaining / offer.amount) * 100
    const progressBar = getProgressBar(percentRemaining)
    message += `📦 <b>${offer.remaining}</b> из <b>${offer.amount} ${offer.crypto}</b>`

    if (offer.minAmount && offer.minAmount > 0) {
      message += ` • мин. <b>${offer.minAmount}</b>`
    }
    message += `\n${progressBar} ${percentRemaining.toFixed(0)}%\n\n`

    const remainingInCurrency = (offer.rate * offer.remaining).toFixed(2)
    message += `💰 <b>${offer.rate} ${offer.currency}</b> за 1 ${offer.crypto}`

    if (offer.minAmount && offer.minAmount > 0) {
      const minInCurrency = (offer.rate * offer.minAmount).toFixed(2)
      message += ` • мин. <b>${minInCurrency} ${offer.currency}</b>`
    }
    message += `\nСумма: <b>${remainingInCurrency} ${offer.currency}</b>\n\n`

    message += `👤 <a href="tg://user?id=${offer.userId}">@${offer.username}</a> `

    if (offer.userRating && offer.userRating.totalDeals > 0) {
      const rating = offer.userRating.averageRating
      const badges = getUserBadges(offer.userRating)
      // Filter out sponsor badges - they're already shown at the top
      const nonSponsorBadges = badges.filter((b) => !b.id.startsWith("sponsor_"))
      const topBadge = nonSponsorBadges.length > 0 ? nonSponsorBadges[0] : null

      if (topBadge) {
        message += `${topBadge.icon} `
      }

      if (rating > 0) {
        message += `${getRatingStars(rating)}`
      } else {
        message += `⭐ ${offer.userRating.totalDeals} ${getDealWord(offer.userRating.totalDeals)}`
      }

      // Show additional non-sponsor badges
      if (nonSponsorBadges.length > 1) {
        const additionalBadges = formatBadges(nonSponsorBadges.slice(1), 2)
        if (additionalBadges) {
          message += ` ${additionalBadges}`
        }
      }
    } else {
      message += "🆕 <b>Новичок</b>"
    }
    message += `\n`

    if (offer.paymentMethod || offer.customPaymentDetails) {
      message += `💳 ${offer.paymentMethod || ""}`
      if (offer.customPaymentDetails) {
        message += ` • <i>${offer.customPaymentDetails}</i>`
      }
      message += `\n`
    }

    const createdDate = new Date(offer.createdAt)
    const timeAgo = getTimeAgo(createdDate)
    message += `\n⏰ ${timeAgo}`

    if (offer.requests && offer.requests.length > 0) {
      const pendingRequests = offer.requests.filter((r) => r.status === "pending").length
      if (pendingRequests > 0) {
        message += ` • 📨 <b>${pendingRequests}</b> откликов 🔥`
      }
    }

    message += `\n🆔 <code>${offer.id.substring(0, 8)}</code>`

    return message
  } catch (error) {
    console.error("Error formatting offer message:", error)
    return `Ошибка форматирования объявления. ID: ${offer?.id || "unknown"}`
  }
}

function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 10)
  const empty = 10 - filled
  return "▰".repeat(filled) + "▱".repeat(empty)
}

// Get rating stars
export function getRatingStars(rating: number): string {
  rating = Math.round(rating * 10) / 10
  const fullStars = Math.floor(rating)
  const remainder = rating - fullStars

  let stars = "⭐".repeat(fullStars)

  if (remainder >= 0.5) {
    stars += "⭐"
  }

  return `${stars} ${rating.toFixed(1)}`
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "только что"
  if (diffMins < 60) return `${diffMins} мин назад`
  if (diffHours < 24) return `${diffHours} ч назад`
  if (diffDays === 1) return "вчера"
  if (diffDays < 7) return `${diffDays} дн назад`

  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
}

// Get status text
export function getStatusText(status: string): string {
  return config.statusMessages[status] || status
}

// Format active offers list
export function formatActiveOffersList(offers: Offer[]): string {
  try {
    if (!offers || !offers.length) {
      return "🔹 Нет активных объявлений"
    }

    let message = "🔹 Активные объявления:\n\n"

    offers.forEach((offer, index) => {
      const type = offer.type === "sell" ? "Продажа" : "Покупка"
      const pendingRequests = offer.requests?.filter((r) => r.status === "pending").length || 0

      message += `${index + 1}. ${type} ${offer.amount} ${offer.crypto} (${offer.network})\n`
      message += `   Курс: ${offer.rate} ${offer.currency}\n`
      message += `   Осталось: ${offer.remaining} ${offer.crypto}`

      if (pendingRequests > 0) {
        message += ` | Заявок: ${pendingRequests}`
      }

      message += `\n\n`
    })

    return message
  } catch (error) {
    console.error("Error formatting active offers list:", error)
    return "Ошибка при форматировании списка объявлений"
  }
}

// Format user requests list
export function formatUserRequestsList(requests: Request[], offers: Record<string, Offer>): string {
  try {
    if (!requests || !requests.length) {
      return "📋 У вас нет заявок"
    }

    let message = "📋 Ваши заявки:\n\n"

    requests.forEach((request, index) => {
      const offer = offers[request.offerId]
      if (!offer) return

      const type = offer.type === "sell" ? "Покупка" : "Продажа"
      const statusEmoji = getStatusEmoji(request.status)

      message += `${index + 1}. ${statusEmoji} ${type} ${request.amount} ${offer.crypto}\n`
      message += `   Курс: ${offer.rate} ${offer.currency}\n`
      message += `   Статус: ${getStatusText(request.status)}\n\n`
    })

    return message
  } catch (error) {
    console.error("Error formatting user requests list:", error)
    return "Ошибка при форматировании списка заявок"
  }
}

// Get status emoji
function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    pending: "⏳",
    accepted: "✅",
    completed: "🏁",
    disputed: "⚠️",
    rejected: "❌",
    cancelled: "🚫",
  }
  return emojiMap[status] || "❓"
}

// Format transaction history
export function formatTransactionHistory(transactions: Transaction[]): string {
  try {
    if (!transactions || !transactions.length) {
      return "📊 У вас нет завершенных сделок"
    }

    let message = "📊 История сделок:\n\n"

    transactions.forEach((tx, index) => {
      const date = new Date(tx.completedAt || tx.createdAt)
      message += `${index + 1}. ${date.toLocaleDateString("ru-RU")}\n`
      message += `   ${tx.amount} ${tx.crypto} по ${tx.rate} ${tx.currency}\n`
      message += `   Сеть: ${tx.network}\n\n`
    })

    return message
  } catch (error) {
    console.error("Error formatting transaction history:", error)
    return "Ошибка при форматировании истории"
  }
}

// Get request inline keyboard
export function getRequestInlineKeyboard(requestId: string, status: RequestStatus, isOfferAuthor = false) {
  try {
    if (!requestId) {
      console.error("Invalid request ID")
      return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
    }

    const buttons = []

    if (status === "pending") {
      if (isOfferAuthor) {
        buttons.push([
          Markup.button.callback("✅ Принять", `accept_${requestId}`),
          Markup.button.callback("❌ Отклонить", `reject_${requestId}`),
        ])
      } else {
        buttons.push([Markup.button.callback("🚫 Отменить", `cancel_request_${requestId}`)])
      }
    } else if (status === "accepted") {
      buttons.push([Markup.button.callback("🏁 Завершить", `complete_${requestId}`)])
      buttons.push([Markup.button.callback("💬 Связаться", `contact_user_${requestId}`)])

      if (isOfferAuthor) {
        buttons.push([Markup.button.callback("❌ Отменить", `cancel_accepted_${requestId}`)])
      }
    } else if (status === "disputed") {
      buttons.push([Markup.button.callback("🔄 Решить спор", `resolve_dispute_${requestId}`)])
    }

    return Markup.inlineKeyboard(buttons)
  } catch (error) {
    console.error("Error creating request inline keyboard:", error)
    return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
  }
}

// Create message link
export function createMessageLink(chatId: number, messageId: number): string {
  try {
    if (!chatId || !messageId) {
      throw new Error("Invalid chat ID or message ID")
    }

    const chatIdStr = chatId.toString().replace("-100", "")
    return `https://t.me/c/${chatIdStr}/${messageId}`
  } catch (error) {
    console.error("Error creating message link:", error)
    throw error
  }
}

// Send help tip
export async function sendHelpTip(ctx: Context, tipType: string): Promise<void> {
  try {
    if (!ctx.from) return

    const settings = await getUserSettings(ctx.from.id)

    if (settings && settings.showTips === false) return

    const tip = config.tips[tipType]
    if (tip) {
      await ctx.reply(tip)
    }
  } catch (error) {
    console.error("Error sending help tip:", error)
  }
}

// Get personalized welcome
export function getPersonalizedWelcome(firstName: string): string {
  try {
    if (!firstName) {
      firstName = "Пользователь"
    }

    return `👋 Добро пожаловать, ${firstName}!

Я помогу вам обмениваться криптовалютой в P2P-группе.

Что я умею:
• Создавать объявления о покупке/продаже криптовалют
• Показывать ваши текущие объявления и заявки
• Управлять сделками, не захламляя общий чат`
  } catch (error) {
    console.error("Error creating personalized welcome:", error)
    return "👋 Добро пожаловать!"
  }
}

// Publish offer to group
export async function publishOffer(
  ctx: Context,
  userId: number,
  groupId: number,
  type: "sell" | "buy",
  data: any,
): Promise<void> {
  try {
    console.log(`[v0] Publishing ${type} offer for user ${userId} to group ${groupId}`)

    if (!userId || !groupId || !type || !data) {
      console.error("Invalid parameters for publishOffer")
      throw new Error("Invalid parameters for publishOffer")
    }

    const isMember = await isUserMemberOfGroup(ctx, userId, groupId)

    if (!isMember) {
      await ctx.reply(
        "⚠️ Вы не являетесь участником выбранной группы. Пожалуйста, сначала вступите в группу или выберите другую группу с помощью команды /selectgroup",
      )
      return
    }

    const userRating = await getUserRating(userId)

    console.log(`[v0] Creating offer with data:`, {
      type,
      userId,
      crypto: data.crypto,
      amount: data.amount,
      minAmount: data.minAmount,
    })

    const offer = await createOffer({
      type,
      userId,
      username: ctx.from?.username || "unknown",
      chatId: groupId,
      messageId: 0,
      crypto: data.crypto,
      network: data.network,
      amount: data.amount,
      remaining: data.amount,
      minAmount: data.minAmount, // Added minAmount field
      currency: data.currency,
      rate: data.rate,
      paymentMethod: data.paymentMethod,
      customPaymentDetails: data.customPaymentDetails,
      userRating,
    })

    console.log(`[v0] Offer created with ID ${offer.id}, status: ${offer.status}, minAmount: ${offer.minAmount}`)

    const messageText = formatOfferMessage(offer)

    const keyboard = getOfferInlineKeyboard(offer.id, false)

    console.log(`[v0] Sending message to group ${groupId} with keyboard:`, JSON.stringify(keyboard.reply_markup))

    const sentMessage = (await ctx.telegram.sendMessage(groupId, messageText, {
      parse_mode: "HTML",
      reply_markup: keyboard.reply_markup,
    })) as Message.TextMessage

    console.log(`[v0] Message sent with ID ${sentMessage.message_id}`)

    offer.messageId = sentMessage.message_id
    await updateOffer(offer)

    console.log(`[v0] Offer updated with messageId ${sentMessage.message_id}`)

    await clearUserState(userId)
    await ctx.reply(`✅ Объявление о ${type === "sell" ? "продаже" : "покупке"} ${data.crypto} успешно создано!`, {
      reply_markup: { remove_keyboard: true },
    })

    await sendHelpTip(ctx, type)
    await ctx.reply("Выберите действие:", mainKeyboard)
  } catch (error) {
    console.error(`[v0] Error publishing ${type} offer to group ${groupId}:`, error)
    await ctx.reply(`❌ Произошла ошибка при публикации объявления. Пожалуйста, попробуйте еще раз.`)
    await clearUserState(userId)
    await ctx.reply("Выберите действие:", mainKeyboard)
  }
}

export function getOfferInlineKeyboard(offerId: string, isAuthor = false) {
  try {
    if (!offerId) {
      console.error("[v0] Invalid offer ID for keyboard")
      return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
    }

    console.log(`[v0] Creating keyboard for offer ${offerId}, isAuthor: ${isAuthor}`)

    const buttons = []

    buttons.push([Markup.button.callback("✅ Откликнуться", `respond_${offerId}`)])
    buttons.push([Markup.button.callback("📊 Статус", `status_${offerId}`)])
    console.log(`[v0] Added public buttons (Respond, Status) - visible to ALL users`)

    if (isAuthor) {
      buttons.push([Markup.button.callback("📨 Заявки", `check_requests_${offerId}`)])
      buttons.push([
        Markup.button.callback("✏️ Редактировать", `edit_${offerId}`),
        Markup.button.callback("❌ Закрыть", `close_${offerId}`),
      ])
      console.log(`[v0] Added author buttons (Requests, Edit, Close) - only for author`)
    }

    console.log(`[v0] Total button rows created: ${buttons.length}`)

    const keyboard = Markup.inlineKeyboard(buttons)

    if (!keyboard.reply_markup || !keyboard.reply_markup.inline_keyboard) {
      console.error("[v0] Keyboard structure is invalid:", keyboard)
      return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
    }

    const hasRespondButton = keyboard.reply_markup.inline_keyboard.some((row) =>
      row.some((btn) => "callback_data" in btn && btn.callback_data?.startsWith("respond_")),
    )
    const hasStatusButton = keyboard.reply_markup.inline_keyboard.some((row) =>
      row.some((btn) => "callback_data" in btn && btn.callback_data?.startsWith("status_")),
    )

    if (!hasRespondButton || !hasStatusButton) {
      console.error("[v0] WARNING: Public buttons are missing!", {
        hasRespondButton,
        hasStatusButton,
        keyboard: JSON.stringify(keyboard.reply_markup),
      })
    } else {
      console.log(`[v0] ✓ Verified: Public buttons (Respond & Status) are present`)
    }

    console.log(`[v0] Final keyboard structure:`, JSON.stringify(keyboard.reply_markup.inline_keyboard))

    return keyboard
  } catch (error) {
    console.error("[v0] Error creating offer inline keyboard:", error)
    return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
  }
}

export function getEditOfferInlineKeyboard(offerId: string) {
  try {
    if (!offerId) {
      console.error("Invalid offer ID")
      return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
    }

    const buttons = [
      [Markup.button.callback("💱 Изменить курс", `edit_rate_${offerId}`)],
      [Markup.button.callback("💰 Изменить количество", `edit_amount_${offerId}`)],
      [Markup.button.callback("💳 Изменить способ оплаты", `edit_payment_${offerId}`)],
      [Markup.button.callback("📝 Изменить детали", `edit_details_${offerId}`)],
      [Markup.button.callback("❌ Отмена", `cancel_edit_${offerId}`)],
    ]

    return Markup.inlineKeyboard(buttons)
  } catch (error) {
    console.error("Error creating edit offer inline keyboard:", error)
    return Markup.inlineKeyboard([[Markup.button.callback("Ошибка", "error")]])
  }
}

function getDealWord(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "сделок"
  if (lastDigit === 1) return "сделка"
  if (lastDigit >= 2 && lastDigit <= 4) return "сделки"
  return "сделок"
}

// Send donation reminder
export async function sendDonationReminder(ctx: Context) {
  const message = `
<b>🙏 Поддержите развитие проекта!</b>

Мы стараемся сделать обмен криптовалют удобным и безопасным для вас. Бот работает бесплатно, но серверы и поддержка требуют затрат.

Если вам нравится наш сервис, вы можете поддержать нас любой суммой:

<b>USDT (TRC20):</b> <code>TJFsMFCPtHMnCgHTNFsByH8DfZsvZeyQy7</code>
<b>AXM:</b> <code>axm1p9g8yads5u6aer0hxze7gze36jklljrvxlnczz</code>

После внесения пожертвования напишите @Pompario для получения уникального бейджа спонсора! 🏅
`
  await ctx.reply(message, { parse_mode: "HTML" })
}
