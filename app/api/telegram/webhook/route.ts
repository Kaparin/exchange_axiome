import { type NextRequest, NextResponse } from "next/server"
import bot from "../../../../lib/telegram/bot"

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    await bot.handleUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook handler error:", error)
    return NextResponse.json({ ok: true })
  }
}
