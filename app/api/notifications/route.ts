import { NextResponse } from "next/server"
import { prisma } from "../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET(req: Request) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const unread = searchParams.get("unread") === "1"

  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unread ? { readAt: null } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ ok: true, notifications })
}

export async function PATCH() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
