import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../lib/auth/session"

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const offer = await prisma.offer.findUnique({
    where: { id: params.id },
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

  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true, offer })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const offer = await prisma.offer.findUnique({ where: { id: params.id } })
  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const { status, paymentInfo, minAmount, maxAmount, rate } = body || {}

  const data: Record<string, unknown> = {}
  if (status) data.status = status
  if (paymentInfo !== undefined) data.paymentInfo = paymentInfo || null
  if (minAmount !== undefined) data.minAmount = Number(minAmount)
  if (maxAmount !== undefined) data.maxAmount = Number(maxAmount)
  if (rate !== undefined) data.rate = Number(rate)

  const updated = await prisma.offer.update({
    where: { id: offer.id },
    data,
  })

  return NextResponse.json({ ok: true, offer: updated })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const offer = await prisma.offer.findUnique({ where: { id: params.id } })
  if (!offer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.offer.update({
    where: { id: offer.id },
    data: { status: "CLOSED" },
  })

  return NextResponse.json({ ok: true, offer: updated })
}
