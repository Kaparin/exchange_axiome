import crypto from "crypto"

export interface TelegramWebAppUser {
  id: number
  is_bot?: boolean
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface InitDataPayload {
  auth_date?: string
  hash?: string
  query_id?: string
  user?: TelegramWebAppUser
  [key: string]: string | TelegramWebAppUser | undefined
}

function parseInitData(initData: string): InitDataPayload {
  const params = new URLSearchParams(initData)
  const payload: InitDataPayload = {}

  for (const [key, value] of params.entries()) {
    if (key === "user") {
      try {
        payload.user = JSON.parse(value)
      } catch {
        payload.user = undefined
      }
    } else {
      payload[key] = value
    }
  }

  return payload
}

function buildDataCheckString(params: URLSearchParams): string {
  const pairs: string[] = []
  for (const [key, value] of params.entries()) {
    if (key === "hash") continue
    pairs.push(`${key}=${value}`)
  }
  return pairs.sort().join("\n")
}

export function verifyInitData(initData: string, botToken: string, maxAgeSeconds = 86400): InitDataPayload | null {
  if (!initData || !botToken) return null

  const params = new URLSearchParams(initData)
  const hash = params.get("hash")
  if (!hash) return null

  const dataCheckString = buildDataCheckString(params)
  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest()
  const expectedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex")

  if (expectedHash !== hash) return null

  const payload = parseInitData(initData)
  if (payload.auth_date) {
    const authDate = Number.parseInt(payload.auth_date, 10)
    const nowSeconds = Math.floor(Date.now() / 1000)
    if (Number.isFinite(authDate) && nowSeconds - authDate > maxAgeSeconds) {
      return null
    }
  }

  return payload
}

export { parseInitData }
