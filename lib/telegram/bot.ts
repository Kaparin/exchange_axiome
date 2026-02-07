import { Telegraf } from "telegraf"

function getWebAppUrl(): string {
  if (process.env.WEBAPP_URL) return process.env.WEBAPP_URL
  if (process.env.WEBHOOK_URL) return process.env.WEBHOOK_URL
  return "https://example.com"
}

let botInstance: Telegraf | null = null

export function getBot(): Telegraf {
  if (botInstance) return botInstance

  if (!process.env.BOT_TOKEN) {
    throw new Error("BOT_TOKEN is missing")
  }

  const bot = new Telegraf(process.env.BOT_TOKEN)

  bot.start(async (ctx) => {
    const webAppUrl = getWebAppUrl()
    await ctx.reply("Открыть приложение:", {
      reply_markup: {
        inline_keyboard: [[{ text: "Open WebApp", web_app: { url: webAppUrl } }]],
      },
    })
  })

  bot.catch((err, ctx) => {
    console.error(`Bot error in ${ctx.updateType}:`, err)
  })

  botInstance = bot
  return botInstance
}
