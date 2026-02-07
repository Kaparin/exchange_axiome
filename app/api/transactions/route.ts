import { NextResponse } from "next/server"
import { prisma } from "../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      OR: [{ buyerId: session.user.id }, { sellerId: session.user.id }],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ ok: true, transactions })
}
