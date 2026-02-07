export function isAdmin(userId: number): boolean {
  if (!userId) return false
  const adminIds = process.env.ADMIN_IDS
    ? process.env.ADMIN_IDS.split(",").map((id) => Number.parseInt(id.trim(), 10))
    : []
  return adminIds.includes(userId)
}

export function isValidApiKey(apiKey: string | null | undefined): boolean {
  if (!apiKey || !process.env.ADMIN_API_KEY) return false
  return apiKey === process.env.ADMIN_API_KEY
}
