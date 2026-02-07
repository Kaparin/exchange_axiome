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

  if (request.offer.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.request.update({
    where: { id: request.id },
    data: { status: "ACCEPTED" },
  })

  return NextResponse.json({ ok: true, request: updated })
}
