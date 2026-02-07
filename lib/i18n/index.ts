import { getUserSettings } from "../db"

// Поддерживаемые языки
export type SupportedLanguage = "ru" | "en"

// Интерфейс для строк локализации
interface LocalizationStrings {
  [key: string]: {
    [lang in SupportedLanguage]: string
  }
}

// Строки локализации
const strings: LocalizationStrings = {
  welcome: {
    ru: "Добро пожаловать в бот обмена криптовалютой!",
    en: "Welcome to the cryptocurrency exchange bot!",
  },
  help: {
    ru: "Помощь по использованию бота",
    en: "Help on using the bot",
  },
  sell_command: {
    ru: "Команда для создания объявления о продаже криптовалюты",
    en: "Command to create a cryptocurrency sell offer",
  },
  buy_command: {
    ru: "Команда для создания объявления о покупке криптовалюты",
    en: "Command to create a cryptocurrency buy offer",
  },
  my_offers: {
    ru: "Ваши объявления",
    en: "Your offers",
  },
  my_requests: {
    ru: "Ваши заявки",
    en: "Your requests",
  },
  settings: {
    ru: "Настройки",
    en: "Settings",
  },
  language_changed: {
    ru: "Язык изменен на русский",
    en: "Language changed to English",
  },
  notifications_enabled: {
    ru: "Уведомления включены",
    en: "Notifications enabled",
  },
  notifications_disabled: {
    ru: "Уведомления отключены",
    en: "Notifications disabled",
  },
  tips_enabled: {
    ru: "Подсказки включены",
    en: "Tips enabled",
  },
  tips_disabled: {
    ru: "Подсказки отключены",
    en: "Tips disabled",
  },
  offer_created: {
    ru: "Объявление успешно создано",
    en: "Offer successfully created",
  },
  offer_closed: {
    ru: "Объявление закрыто",
    en: "Offer closed",
  },
  request_created: {
    ru: "Заявка успешно создана",
    en: "Request successfully created",
  },
  request_accepted: {
    ru: "Заявка принята",
    en: "Request accepted",
  },
  request_rejected: {
    ru: "Заявка отклонена",
    en: "Request rejected",
  },
  transaction_completed: {
    ru: "Сделка завершена",
    en: "Transaction completed",
  },
  rating_submitted: {
    ru: "Отзыв отправлен",
    en: "Rating submitted",
  },
  error_occurred: {
    ru: "Произошла ошибка",
    en: "An error occurred",
  },
  // Добавляем строки для уведомлений
  notification_new_request: {
    ru: "Новая заявка на {amount} {crypto} от @{username}!",
    en: "New request for {amount} {crypto} from @{username}!",
  },
  notification_request_accepted: {
    ru: "Ваша заявка на {amount} {crypto} принята.",
    en: "Your request for {amount} {crypto} has been accepted.",
  },
  notification_request_rejected: {
    ru: "Ваша заявка на {amount} {crypto} отклонена.",
    en: "Your request for {amount} {crypto} has been rejected.",
  },
  notification_offer_closed: {
    ru: "Объявление {offerId} закрыто.",
    en: "Offer {offerId} has been closed.",
  },
  notification_transaction_completed: {
    ru: "Сделка на {amount} {crypto} успешно завершена! ID: {transactionId}",
    en: "Transaction for {amount} {crypto} successfully completed! ID: {transactionId}",
  },
  notification_rating_received: {
    ru: "Вы получили новый отзыв от @{username} с оценкой {score}{comment}",
    en: "You received a new review from @{username} with a rating of {score}{comment}",
  },
  notification_admin_message: {
    ru: "Сообщение от администратора: {message}",
    en: "Message from administrator: {message}",
  },
}

// Функция для получения строки на языке пользователя
export async function getStringForUser(
  key: keyof typeof strings,
  userId: number,
  params: Record<string, string | number> = {},
): Promise<string> {
  try {
    // Получаем настройки пользователя
    const settings = await getUserSettings(userId)

    // Определяем язык пользователя
    const lang = (settings?.language || "ru") as SupportedLanguage

    // Получаем строку
    let str = strings[key]?.[lang] || key

    // Заменяем параметры в строке
    for (const [param, value] of Object.entries(params)) {
      str = str.replace(new RegExp(`{${param}}`, "g"), String(value))
    }

    return str
  } catch (error) {
    console.error(`Error getting string for user ${userId}, key ${key}:`, error)
    return key
  }
}

// Функция для получения строки на указанном языке
export function getString(key: keyof typeof strings, lang: SupportedLanguage = "ru"): string {
  return strings[key]?.[lang] || key
}
