// Offer types
export type OfferType = "buy" | "sell"
export type OfferStatus = "active" | "closed"
export type CryptoType = string
export type NetworkType = string
export type CurrencyType = string
export type PaymentMethodType = string

export interface Offer {
  id: string
  userId: number
  username: string
  type: OfferType
  crypto: CryptoType
  network: NetworkType
  amount: number
  remaining: number
  currency: CurrencyType
  rate: number
  paymentMethod?: PaymentMethodType
  minAmount?: number
  maxAmount?: number
  customPaymentDetails?: string
  createdAt: number
  status: OfferStatus
  requests: Request[]
  chatId: number
  messageId: number
  userRating?: UserRating // Add userRating to Offer type
}

// Request types
export type RequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "payment_pending"
  | "payment_sent"
  | "payment_confirmed"
  | "crypto_sent"
  | "completed"
  | "disputed"

export interface Request {
  id: string
  offerId: string
  userId: number
  username: string
  amount: number
  createdAt: number
  status: RequestStatus
  details?: string
  completionDeadline?: number
}

// Transaction types
export type TransactionStatus = "pending" | "completed" | "cancelled"

export interface Transaction {
  id: string
  requestId: string
  offerId: string
  buyerId: number
  sellerId: number
  buyerUsername: string
  sellerUsername: string
  crypto: CryptoType
  network: NetworkType
  amount: number
  currency: CurrencyType
  rate: number
  paymentMethod?: PaymentMethodType
  createdAt: number
  completedAt?: number
  status: TransactionStatus
}

// User state types
export interface UserState {
  userId: number
  step: string
  data: Record<string, any>
  expireAt: number
}

// User settings types
export interface UserSettings {
  userId: number
  language: string
  notifications: boolean
  showTips: boolean
  lastActivity: number
}

// Rating types
export interface Rating {
  fromUserId: number
  fromUsername: string
  transactionId: string
  score: number
  comment?: string
  createdAt: number
}

export interface UserRating {
  userId: number
  username: string
  totalDeals: number
  successfulDeals: number
  totalVolume: number
  averageRating: number
  positiveReviews?: number
  negativeReviews?: number
  ratings: Rating[]
  lastUpdated: number
  averageResponseTime?: number // in milliseconds
  disputes?: number // number of disputes
  donatedAmount?: number // Total amount donated in USD
  publishedOffers?: number // Total number of offers published
}

// Group types
export interface GroupInfo {
  id: number
  title: string
  memberCount?: number
  botStatus?: string
}

// Response data type
export interface UserResponseData {
  action: string
  offerId?: string
  [key: string]: any
}
