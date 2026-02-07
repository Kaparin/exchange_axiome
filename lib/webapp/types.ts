export type Offer = {
  id: string
  type: "BUY" | "SELL"
  status?: "ACTIVE" | "CLOSED"
  crypto: string
  network: string
  amount: number
  remaining: number
  currency: string
  rate: number
  paymentInfo?: string | null
  minAmount?: number | null
  maxAmount?: number | null
  _count?: { requests: number }
  userId?: string
}

export type RequestItem = {
  id: string
  userId: string
  amount: number
  status: string
  offer: Offer
}

export type TransactionItem = {
  id: string
  amount: number
  currency: string
  rate: number
  status: string
  createdAt: string
  completedAt?: string | null
}

export type WalletItem = {
  id: string
  type: string
  label?: string | null
  value: string
  isDefault: boolean
}

export type NotificationItem = {
  id: string
  type: string
  title: string
  body?: string | null
  readAt?: string | null
  createdAt: string
}

export type AdminStats = {
  users: number
  offers: number
  requests: number
  transactions: number
}

export type MeResult = {
  ok?: boolean
  user?: {
    id: string
    telegramId: string
    username?: string | null
    firstName?: string | null
    lastName?: string | null
    photoUrl?: string | null
    languageCode?: string | null
  }
}

