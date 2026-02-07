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
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const crypto = searchParams.get("crypto")
  const network = searchParams.get("network")
  const currency = searchParams.get("currency")
  const minRate = Number(searchParams.get("minRate") || "")
  const maxRate = Number(searchParams.get("maxRate") || "")
  const page = Number(searchParams.get("page") || "1")
  const pageSize = Number(searchParams.get("pageSize") || "20")

  const where: Record<string, unknown> = mine
    ? { userId: session.user.id }
    : { status: status || "ACTIVE" }

  if (type) where.type = type
  if (status && !mine) where.status = status
  if (crypto) where.crypto = crypto
  if (network) where.network = network
  if (currency) where.currency = currency
  if (Number.isFinite(minRate)) where.rate = { ...(where.rate as object), gte: minRate }
  if (Number.isFinite(maxRate)) where.rate = { ...(where.rate as object), lte: maxRate }

  const offers = await prisma.offer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
    include: {
      user: {
        select: {
          id: true,
          telegramId: true,
          username: true,
        },
      },
      _count: {
        select: { requests: true },
      },
    },
  })

  const total = await prisma.offer.count({ where })
  const totalAll = await prisma.offer.count()
  const rawCount = await prisma.$queryRawUnsafe<Array<{count: bigint}>>(
    `SELECT count(*) as count FROM "Offer"`
  ).catch((e: Error) => [{ count: BigInt(0), error: e.message }])

  return NextResponse.json({
    ok: true, offers, page, pageSize, total,
    _debug: {
      where: JSON.stringify(where),
      totalAll,
      rawSqlCount: String(rawCount?.[0]?.count),
      rawResult: rawCount,
    },
  })
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

  // Debug: verify the offer was actually saved
  const totalAfter = await prisma.offer.count()
  const rawCount = await prisma.$queryRawUnsafe<Array<{count: bigint}>>(
    `SELECT count(*) as count FROM "Offer"`
  ).catch((e: Error) => [{ count: BigInt(0), error: e.message }])

  return NextResponse.json({
    ok: true,
    offer,
    _debug: {
      prismaCount: totalAfter,
      rawSqlCount: String(rawCount?.[0]?.count),
      rawResult: rawCount,
      createdId: offer.id,
    },
  })
}
