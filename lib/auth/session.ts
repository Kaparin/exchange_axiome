import crypto from "crypto"
import { cookies } from "next/headers"
import { prisma } from "../db/prisma"

const SESSION_COOKIE_NAME = "session"
const SESSION_TTL_DAYS = 30

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

function getSessionExpiry(): Date {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_TTL_DAYS)
  return expiresAt
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex")
  const tokenHash = hashToken(token)
  const expiresAt = getSessionExpiry()

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  return token
}

export function setSessionCookie(token: string) {
  const cookieStore = cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  })
}

export async function getSessionFromCookies() {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null

  const tokenHash = hashToken(token)
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!session) return null

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { tokenHash } })
    return null
  }

  return session
}

export async function clearSession() {
  const cookieStore = cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (token) {
    const tokenHash = hashToken(token)
    await prisma.session.delete({ where: { tokenHash } }).catch(() => {})
  }
  cookieStore.delete(SESSION_COOKIE_NAME)
}
