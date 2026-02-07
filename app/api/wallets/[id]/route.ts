import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../lib/auth/session"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const wallet = await prisma.wallet.findUnique({ where: { id: params.id } })
  if (!wallet || wallet.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const { label, value, isDefault } = body || {}

  const updated = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.wallet.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false },
      })
    }
    return tx.wallet.update({
      where: { id: wallet.id },
      data: {
        label: label ?? wallet.label,
        value: value ?? wallet.value,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : wallet.isDefault,
      },
    })
  })

  return NextResponse.json({ ok: true, wallet: updated })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getSessionFromCookies()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const wallet = await prisma.wallet.findUnique({ where: { id: params.id } })
  if (!wallet || wallet.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.wallet.delete({ where: { id: wallet.id } })
  return NextResponse.json({ ok: true })
}
