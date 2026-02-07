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
