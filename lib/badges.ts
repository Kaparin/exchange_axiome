// Badge system for user achievements

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  requirement: (rating: any) => boolean
  priority: number // Higher priority badges are shown first
  category: "experience" | "trust" | "sponsor"
}

// Define all available badges
export const BADGES: Badge[] = [
  // === EXPERIENCE BADGES (by deals count) ===
  {
    id: "newcomer",
    name: "Новичок",
    icon: "🌱",
    description: "Первые шаги в обмене",
    requirement: (r) => r.totalDeals >= 1 && r.totalDeals < 10,
    priority: 1,
    category: "experience",
  },
  {
    id: "trader",
    name: "Трейдер",
    icon: "📊",
    description: "10+ сделок",
    requirement: (r) => r.totalDeals >= 10 && r.totalDeals < 50,
    priority: 2,
    category: "experience",
  },
  {
    id: "pro",
    name: "Профи",
    icon: "⭐",
    description: "50+ сделок",
    requirement: (r) => r.totalDeals >= 50 && r.totalDeals < 100,
    priority: 3,
    category: "experience",
  },
  {
    id: "expert",
    name: "Эксперт",
    icon: "🏆",
    description: "100+ сделок",
    requirement: (r) => r.totalDeals >= 100,
    priority: 4,
    category: "experience",
  },

  // === TRUST BADGES (verified sellers) ===
  {
    id: "verified",
    name: "Проверенный",
    icon: "✅",
    description: "10+ сделок с рейтингом 4.5+",
    requirement: (r) => r.totalDeals >= 10 && r.averageRating >= 4.5,
    priority: 10,
    category: "trust",
  },
  {
    id: "trusted",
    name: "Надежный",
    icon: "🛡️",
    description: "50+ сделок с рейтингом 4.8+",
    requirement: (r) => r.totalDeals >= 50 && r.averageRating >= 4.8,
    priority: 11,
    category: "trust",
  },

  // === SPONSOR BADGES ===
  {
    id: "sponsor_bronze",
    name: "Бронзовый спонсор",
    icon: "🥉",
    description: "Поддержал проект",
    requirement: (r) => (r.donatedAmount || 0) >= 1 && (r.donatedAmount || 0) < 25,
    priority: 20,
    category: "sponsor",
  },
  {
    id: "sponsor_silver",
    name: "Серебряный спонсор",
    icon: "🥈",
    description: "Поддержал проект на $25+",
    requirement: (r) => (r.donatedAmount || 0) >= 25 && (r.donatedAmount || 0) < 100,
    priority: 21,
    category: "sponsor",
  },
  {
    id: "sponsor_gold",
    name: "Золотой спонсор",
    icon: "🥇",
    description: "Поддержал проект на $100+",
    requirement: (r) => (r.donatedAmount || 0) >= 100 && (r.donatedAmount || 0) < 500,
    priority: 22,
    category: "sponsor",
  },
  {
    id: "sponsor_diamond",
    name: "Бриллиантовый спонсор",
    icon: "💎",
    description: "Поддержал проект на $500+",
    requirement: (r) => (r.donatedAmount || 0) >= 500,
    priority: 23,
    category: "sponsor",
  },
]

// Get all badges earned by a user
export function getUserBadges(rating: any): Badge[] {
  if (!rating) return []

  const earnedBadges = BADGES.filter((badge) => badge.requirement(rating))

  // Sort by priority (highest first)
  earnedBadges.sort((a, b) => b.priority - a.priority)

  return earnedBadges
}

// Get the top badge for a user (highest priority)
export function getTopBadge(rating: any): Badge | null {
  const badges = getUserBadges(rating)
  return badges.length > 0 ? badges[0] : null
}

// Get badges by category
export function getBadgesByCategory(rating: any, category: Badge["category"]): Badge[] {
  return getUserBadges(rating).filter((b) => b.category === category)
}

// Get sponsor badge
export function getSponsorBadge(rating: any): Badge | null {
  const badges = getUserBadges(rating)
  return badges.find((b) => b.category === "sponsor") || null
}

// Get trust badge (verified/trusted)
export function getTrustBadge(rating: any): Badge | null {
  const badges = getUserBadges(rating)
  return badges.find((b) => b.category === "trust") || null
}

// Get experience badge
export function getExperienceBadge(rating: any): Badge | null {
  const badges = getUserBadges(rating)
  return badges.find((b) => b.category === "experience") || null
}

// Format badges for display
export function formatBadges(badges: Badge[], maxDisplay = 3): string {
  if (!badges || badges.length === 0) return ""

  const displayBadges = badges.slice(0, maxDisplay)
  return displayBadges.map((badge) => badge.icon).join(" ")
}

// Get badge by ID
export function getBadgeById(id: string): Badge | undefined {
  return BADGES.find((badge) => badge.id === id)
}

// Get next badge for a user (show progress to next badge)
export function getNextBadge(rating: any): { badge: Badge; progress: string } | null {
  if (!rating) return null

  const earnedBadges = getUserBadges(rating)
  const earnedIds = new Set(earnedBadges.map((b) => b.id))

  // Find the next badge in each category that the user hasn't earned yet
  const experienceBadges = BADGES.filter((b) => b.category === "experience" && !earnedIds.has(b.id))
  const trustBadges = BADGES.filter((b) => b.category === "trust" && !earnedIds.has(b.id))
  const sponsorBadges = BADGES.filter((b) => b.category === "sponsor" && !earnedIds.has(b.id))

  // Prioritize showing progress to next experience badge
  if (experienceBadges.length > 0) {
    const nextExpBadge = experienceBadges[0]
    let targetDeals = 10
    if (nextExpBadge.id === "trader") targetDeals = 10
    else if (nextExpBadge.id === "pro") targetDeals = 50
    else if (nextExpBadge.id === "expert") targetDeals = 100

    const progress = `${rating.totalDeals || 0}/${targetDeals} сделок`
    return { badge: nextExpBadge, progress }
  }

  // Then trust badges
  if (trustBadges.length > 0) {
    const nextTrustBadge = trustBadges[0]
    let targetDeals = 10
    let targetRating = 4.5
    if (nextTrustBadge.id === "verified") {
      targetDeals = 10
      targetRating = 4.5
    } else if (nextTrustBadge.id === "trusted") {
      targetDeals = 50
      targetRating = 4.8
    }

    const dealsProgress = Math.min(rating.totalDeals || 0, targetDeals)
    const ratingProgress = (rating.averageRating || 0).toFixed(1)
    const progress = `${dealsProgress}/${targetDeals} сделок, рейтинг ${ratingProgress}/${targetRating}`
    return { badge: nextTrustBadge, progress }
  }

  // Then sponsor badges
  if (sponsorBadges.length > 0) {
    const nextSponsorBadge = sponsorBadges[0]
    let targetAmount = 1
    if (nextSponsorBadge.id === "sponsor_bronze") targetAmount = 1
    else if (nextSponsorBadge.id === "sponsor_silver") targetAmount = 25
    else if (nextSponsorBadge.id === "sponsor_gold") targetAmount = 100
    else if (nextSponsorBadge.id === "sponsor_diamond") targetAmount = 500

    const progress = `$${rating.donatedAmount || 0}/$${targetAmount}`
    return { badge: nextSponsorBadge, progress }
  }

  return null
}
