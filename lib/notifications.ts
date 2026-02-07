import { prisma } from "./db/prisma"

export async function createNotification(userId: string, type: string, title: string, body?: string) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body: body || null,
    },
  })
}
