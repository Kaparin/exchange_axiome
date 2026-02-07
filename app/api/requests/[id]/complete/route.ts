import { NextResponse } from "next/server"
import { prisma } from "../../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../../lib/auth/session"

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const request = await prisma.request.findUnique({
    where: { id: params.id },
    include: { offer: true },
  })

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const isParticipant = request.userId === session.user.id || request.offer.userId === session.user.id
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.request.update({
      where: { id: request.id },
      data: { status: "COMPLETED" },
    })

    await tx.transaction.create({
      data: {
        requestId: request.id,
        buyerId: request.offer.type === "SELL" ? request.userId : request.offer.userId,
        sellerId: request.offer.type === "SELL" ? request.offer.userId : request.userId,
        amount: request.amount,
        currency: request.offer.currency,
        rate: request.offer.rate,
        status: "completed",
        completedAt: new Date(),
      },
    })

    return updatedRequest
  })

  return NextResponse.json({ ok: true, request: result })
}
