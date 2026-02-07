import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import { verifyInitData } from "../../../../lib/telegram/verify-init-data"
import { createSession, setSessionCookie } from "../../../../lib/auth/session"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const initData = body?.initData

    if (!initData || typeof initData !== "string") {
      return NextResponse.json({ error: "initData is required" }, { status: 400 })
    }

    const botToken = process.env.BOT_TOKEN
    if (!botToken) {
      return NextResponse.json({ error: "BOT_TOKEN is missing" }, { status: 500 })
    }

    const payload = verifyInitData(initData, botToken)
    if (!payload || !payload.user) {
      return NextResponse.json({ error: "Invalid initData" }, { status: 401 })
    }

    const telegramUser = payload.user
    const telegramId = String(telegramUser.id)

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        photoUrl: telegramUser.photo_url,
      },
      create: {
        telegramId,
        username: telegramUser.username,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name,
        languageCode: telegramUser.language_code,
        photoUrl: telegramUser.photo_url,
      },
    })

    const token = await createSession(user.id)
    setSessionCookie(token)

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
      },
    })
  } catch (error) {
    console.error("Telegram auth error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
