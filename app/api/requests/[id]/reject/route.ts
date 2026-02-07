import { NextResponse } from "next/server"
import { prisma } from "../../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../../lib/auth/session"
import { createNotification } from "../../../../../lib/notifications"

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

  if (request.offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Заявка уже обработана" }, { status: 400 })
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedRequest = await tx.request.update({
      where: { id: request.id },
      data: { status: "REJECTED" },
    })

    await tx.offer.update({
      where: { id: request.offer.id },
      data: { remaining: { increment: request.amount } },
    })

    return updatedRequest
  })

  await createNotification(
    request.userId,
    "request_rejected",
    "Заявка отклонена",
    `Ваша заявка по офферу ${request.offer.id} отклонена`,
  ).catch(() => {})

  return NextResponse.json({ ok: true, request: result })
}
