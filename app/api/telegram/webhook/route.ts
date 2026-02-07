import { type NextRequest, NextResponse } from "next/server"
import { getBot } from "../../../../lib/telegram/bot"

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const bot = getBot()
    await bot.handleUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ ok: true })
  }
}
