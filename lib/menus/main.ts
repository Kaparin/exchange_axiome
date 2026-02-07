import { Markup } from "telegraf"

// Main keyboard
export const mainKeyboard = Markup.keyboard([
  ["💸 Продать крипту", "🛒 Купить крипту"],
  ["📃 Мои объявления", "📋 Мои заявки"],
  ["📊 История сделок", "👥 Рейтинг"],
  ["📈 Курсы криптовалют", "🔄 Выбрать группу"],
  ["⚙️ Настройки", "❓ Помощь"],
]).resize()
