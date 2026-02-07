import { type NextRequest, NextResponse } from "next/server"
import bot from "../../../../lib/telegram/bot"
import { isValidApiKey } from "../../../../lib/admin"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const apiKey = searchParams.get("key")

    if (!isValidApiKey(apiKey)) {
      return NextResponse.json(
        { error: "Unauthorized", hint: "Provide ?key=ADMIN_API_KEY" },
        { status: 401 },
      )
    }

    if (!process.env.WEBHOOK_URL) {
      return NextResponse.json({ error: "WEBHOOK_URL is missing" }, { status: 500 })
    }

    const webhookUrl = `${process.env.WEBHOOK_URL}/api/telegram/webhook`
    await bot.telegram.setWebhook(webhookUrl)

    await bot.telegram.setMyCommands(
      [{ command: "start", description: "Открыть приложение" }],
      { scope: { type: "all_private_chats" } },
    )

    const webhookInfo = await bot.telegram.getWebhookInfo()

    return NextResponse.json({
      success: true,
      webhookUrl,
      webhookInfo,
    })
  } catch (error) {
    console.error("Setup webhook error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
