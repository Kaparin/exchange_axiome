import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/db/prisma"
import { getSessionFromCookies } from "../../../../lib/auth/session"

export async function GET(_: Request, { params }: { params: { id: string } }) {
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

  return NextResponse.json({ ok: true, request })
}
