import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../lib/auth/session"
import { isAdmin } from "../../../../lib/admin"

export async function GET(req: Request) {
  const session = await getSessionFromCookies()
  if (!session || !isAdmin(Number(session.user.telegramId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get("page") || "1")
  const pageSize = Number(searchParams.get("pageSize") || "20")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  })

  const total = await prisma.user.count()

  return NextResponse.json({ ok: true, users, page, pageSize, total })
}
