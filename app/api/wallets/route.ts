import { NextResponse } from "next/server"
import { prisma } from "../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../lib/auth/session"

export async function GET() {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({ ok: true, wallets })
}

export async function POST(req: Request) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const { type, label, value, isDefault } = body || {}

  if (!type || !value) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const wallet = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.wallet.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }

    return tx.wallet.create({
      data: {
        userId: session.user.id,
        type,
        label: label || null,
        value,
        isDefault: Boolean(isDefault),
      },
    })
  })

  return NextResponse.json({ ok: true, wallet })
}
