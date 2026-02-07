import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { clearUserState, incrementPublishedOffers } from "./db"
import { mainKeyboard, cancelKeyboard, publishOffer } from "./telegram-utils"
import { getUserGroup } from "./groups"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Re-export missing functions to satisfy build
export { clearUserState, incrementPublishedOffers, mainKeyboard, cancelKeyboard, publishOffer, getUserGroup }

// Placeholder for input if it was requested
export const input = (value: string) => value
export const userId = (ctx: any) => ctx.from?.id
