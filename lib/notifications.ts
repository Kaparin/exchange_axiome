import { Markup } from "telegraf"
import type { Context } from "telegraf"
import { getOffer, getRequest } from "./db"

// Функция для отправки уведомления о принятии заявки
export async function sendRequestAcceptedNotification(
  ctx: Context,
  requestId: string,
  buyerId: number,
  sellerId: number,
  buyerUsername: string,
  sellerUsername: string,
): Promise<void> {
  try {
    // Получаем данные о заявке и предложении
    const request = await getRequest(requestId)
    if (!request) {
      console.error(`Request ${requestId} not found for notification`)
      return
    }

    const offer = await getOffer(request.offerId)
    if (!offer) {
      console.error(`Offer ${request.offerId} not found for notification`)
      return
    }

    // Формируем сообщение для покупателя
    const buyerMessage = `Ваша заявка на ${request.amount} ${offer.crypto} принята. Свяжитесь с @${sellerUsername} для завершения сделки:`

    // Формируем сообщение для продавца
    const sellerMessage = `Вы приняли заявку на ${request.amount} ${offer.crypto} от @${buyerUsername}. Ожидайте связи для завершения сделки.`

    // Создаем клавиатуру с кнопками действий
    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "💬 Связаться с @" + (offer.type === "sell" ? buyerUsername : sellerUsername),
          `contact_user_${offer.type === "sell" ? buyerId : sellerId}`,
        ),
      ],
      [Markup.button.callback("🏁 Завершить сделку", `complete_transaction_${requestId}`)],
    ])

    // Отправляем уведомление покупателю
    if (ctx.telegram) {
      await ctx.telegram.sendMessage(buyerId, buyerMessage, keyboard)
    }

    // Отправляем уведомление продавцу (если это не тот же пользователь, который вызвал команду)
    if (ctx.from?.id !== sellerId && ctx.telegram) {
      await ctx.telegram.sendMessage(sellerId, sellerMessage, keyboard)
    }
  } catch (error) {
    console.error("Error sending request accepted notification:", error)
  }
}

// Остальные функции уведомлений остаются без изменений
