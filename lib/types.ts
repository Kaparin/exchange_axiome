export interface Offer {
  id: string
  userId: number
  username: string
  type: "buy" | "sell"
  crypto: string
  network: string
  amount: number
  remaining: number
  currency: string
  rate: number
  paymentMethod?: string
  minAmount?: number
  maxAmount?: number
  customPaymentDetails?: string
  createdAt: number
  status: "active" | "closed"
  requests: Request[]
  chatId: number
  messageId: number
  userRating?: UserRating
}

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
  userRating?: UserRating // Add this line
}

export type RequestStatus = "pending" | "accepted" | "completed" | "rejected" | "cancelled" | "disputed"

export interface UserRating {
  userId: number
  username: string
  totalDeals: number
  successfulDeals: number
  totalVolume: number
  averageRating: number
  positiveReviews: number
  negativeReviews: number
  ratings: Array<{
    fromUserId: number
    fromUsername: string
    transactionId: string
    score: number
    comment: string
    createdAt: number
  }>
  lastUpdated: number
}
