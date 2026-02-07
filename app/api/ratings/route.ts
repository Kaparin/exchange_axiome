import { NextResponse } from "next/server"
import { prisma } from "../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }

  const ratings = await prisma.rating.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ ok: true, ratings })
}

export async function POST(req: Request) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { transactionId, score, comment } = body || {}

  if (!transactionId || !score) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const parsedScore = Number(score)
  if (!Number.isFinite(parsedScore) || parsedScore < 1 || parsedScore > 5) {
    return NextResponse.json({ error: "Score must be 1-5" }, { status: 400 })
  }

  const tx = await prisma.transaction.findUnique({ where: { id: transactionId } })
  if (!tx || tx.status !== "completed") {
    return NextResponse.json({ error: "Transaction not completed" }, { status: 400 })
  }

  const isParticipant = tx.buyerId === session.user.id || tx.sellerId === session.user.id
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const targetUserId = tx.buyerId === session.user.id ? tx.sellerId : tx.buyerId

  const existing = await prisma.rating.findFirst({
    where: { transactionId: tx.id, fromUser: session.user.id },
  })
  if (existing) {
    return NextResponse.json({ error: "Already rated" }, { status: 400 })
  }

  const rating = await prisma.rating.create({
    data: {
      userId: targetUserId,
      fromUser: session.user.id,
      transactionId: tx.id,
      score: parsedScore,
      comment: comment || null,
    },
  })

  return NextResponse.json({ ok: true, rating })
}
