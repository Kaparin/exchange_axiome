import { NextResponse } from "next/server"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      telegramId: session.user.telegramId,
      username: session.user.username,
      firstName: session.user.firstName,
      lastName: session.user.lastName,
      languageCode: session.user.languageCode,
      photoUrl: session.user.photoUrl,
    },
  })
}
