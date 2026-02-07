import { NextResponse } from "next/server"
import { prisma } from "../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const offers = await prisma.offer.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          id: true,
          telegramId: true,
          username: true,
        },
      },
    },
  })

  return NextResponse.json({ ok: true, offers })
}

export async function POST(req: Request) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { type, crypto, network, amount, currency, rate, paymentInfo, minAmount, maxAmount } = body || {}

  if (!type || !crypto || !network || !amount || !currency || !rate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const parsedAmount = Number(amount)
  const parsedRate = Number(rate)
  const parsedMin = minAmount !== undefined ? Number(minAmount) : null
  const parsedMax = maxAmount !== undefined ? Number(maxAmount) : null

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
    return NextResponse.json({ error: "Invalid rate" }, { status: 400 })
  }

  const offer = await prisma.offer.create({
    data: {
      userId: session.user.id,
      type,
      crypto,
      network,
      amount: parsedAmount,
      remaining: parsedAmount,
      currency,
      rate: parsedRate,
      paymentInfo: paymentInfo || null,
      minAmount: parsedMin,
      maxAmount: parsedMax,
      status: "ACTIVE",
    },
  })

  return NextResponse.json({ ok: true, offer })
}
