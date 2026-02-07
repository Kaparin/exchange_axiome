import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../lib/auth/session"
import { isAdmin } from "../../../../lib/admin"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session || !isAdmin(Number(session.user.telegramId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [users, offers, requests, transactions] = await Promise.all([
    prisma.user.count(),
    prisma.offer.count(),
    prisma.request.count(),
    prisma.transaction.count(),
  ])

  return NextResponse.json({ ok: true, users, offers, requests, transactions })
}
