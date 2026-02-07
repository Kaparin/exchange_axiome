import { NextResponse } from "next/server"
import { prisma } from "../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET(req: Request) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const mine = searchParams.get("mine") === "1"
  const offerId = searchParams.get("offerId")

  const requests = await prisma.request.findMany({
    where: mine ? { userId: session.user.id } : offerId ? { offerId } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      offer: true,
    },
  })

  return NextResponse.json({ ok: true, requests })
}

export async function POST(req: Request) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { offerId, amount } = body || {}
  if (!offerId || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const parsedAmount = Number(amount)
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const offer = await tx.offer.findUnique({ where: { id: offerId } })
    if (!offer || offer.status !== "ACTIVE") {
      throw new Error("Offer not available")
    }
    if (offer.remaining < parsedAmount) {
      throw new Error("Not enough remaining")
    }

    const request = await tx.request.create({
      data: {
        offerId: offer.id,
        userId: session.user.id,
        amount: parsedAmount,
        status: "PENDING",
      },
    })

    await tx.offer.update({
      where: { id: offer.id },
      data: {
        remaining: offer.remaining - parsedAmount,
      },
    })

    return request
  })

  return NextResponse.json({ ok: true, request: result })
}
