import { type Context, Markup } from "telegraf"
import { safeSet, safeGet } from "./redis"
import type { GroupInfo } from "../types"
import { config } from "./config"

// Redis key for bot groups
const BOT_GROUPS_KEY = "bot:groups"
const USER_GROUP_PREFIX = "user:group:"

// Get bot groups
export async function getBotGroups(): Promise<GroupInfo[]> {
  try {
    console.log(`[v0] Getting bot groups from Redis key: ${BOT_GROUPS_KEY}`)
    const groups = await safeGet(BOT_GROUPS_KEY)
    console.log(`[v0] Raw groups data from Redis:`, groups, `Type: ${typeof groups}`)

    if (!groups) {
      console.log(`[v0] No groups found in Redis`)
      return []
    }

    if (Array.isArray(groups)) {
      console.log(`[v0] Groups is array with ${groups.length} items`)
      return groups
    }

    // If for some reason it's still a string, try to parse it
    if (typeof groups === "string") {
      console.log(`[v0] Groups is string, attempting to parse`)
      try {
        const parsed = JSON.parse(groups)
        if (Array.isArray(parsed)) {
          console.log(`[v0] Successfully parsed groups, ${parsed.length} items`)
          return parsed
        }
      } catch (e) {
        console.error("[v0] Failed to parse groups string:", e)
      }
    }

    console.error("[v0] Groups data is not an array:", typeof groups, groups)
    return []
  } catch (error) {
    console.error("[v0] Error getting bot groups:", error)
    return []
  }
}

// Add a group to bot groups
export async function addBotGroup(group: GroupInfo): Promise<void> {
  try {
    console.log(`[v0] Adding group to Redis:`, group)

    if (!group || !group.id) {
      console.error("[v0] Invalid group data")
      return
    }

    const groups = await getBotGroups()
    console.log(`[v0] Current groups before adding:`, groups)

    const existingIndex = groups.findIndex((g) => g.id === group.id)
    if (existingIndex >= 0) {
      console.log(`[v0] Group already exists at index ${existingIndex}, updating`)
      groups[existingIndex] = group
    } else {
      console.log(`[v0] Adding new group`)
      groups.push(group)
    }

    console.log(`[v0] Saving groups to Redis:`, groups)
    const result = await safeSet(BOT_GROUPS_KEY, groups)
    console.log(`[v0] Save result:`, result)

    // Verify it was saved
    const verification = await safeGet(BOT_GROUPS_KEY)
    console.log(`[v0] Verification read from Redis:`, verification)
  } catch (error) {
    console.error(`[v0] Error adding bot group ${group.id}:`, error)
  }
}

// Save user's group
export async function saveUserGroup(userId: number, groupId: number): Promise<void> {
  try {
    if (!userId || !groupId) {
      console.error("Invalid user ID or group ID")
      return
    }

    const key = `${USER_GROUP_PREFIX}${userId}`
    await safeSet(key, groupId)
  } catch (error) {
    console.error(`Error saving group ${groupId} for user ${userId}:`, error)
  }
}

// Get user's group
export async function getUserGroup(userId: number): Promise<number | null> {
  try {
    if (!userId) {
      console.error("Invalid user ID")
      return null
    }

    const key = `${USER_GROUP_PREFIX}${userId}`
    const groupId = await safeGet(key)
    return groupId ? Number(groupId) : null
  } catch (error) {
    console.error(`Error getting group for user ${userId}:`, error)
    return null
  }
}

// Get group info
export async function getGroupInfo(ctx: Context, groupId: number): Promise<GroupInfo | null> {
  try {
    if (!groupId) {
      console.error("Invalid group ID")
      return null
    }

    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout getting chat info")), config.apiRequestTimeout)
    })

    const chatPromise = ctx.telegram.getChat(groupId)

    const chat = await Promise.race([chatPromise, timeoutPromise])

    if (!chat) return null

    return {
      id: chat.id,
      title: "title" in chat ? chat.title : `Группа ${chat.id}`,
    }
  } catch (error) {
    console.error(`Error getting info for group ${groupId}:`, error)
    return null
  }
}

// Check if user is member of group
export async function isUserMemberOfGroup(ctx: Context, userId: number, groupId: number): Promise<boolean> {
  try {
    if (!userId || !groupId) {
      console.error("Invalid user ID or group ID")
      return false
    }

    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout checking group membership")), config.apiRequestTimeout)
    })

    const chatMemberPromise = ctx.telegram.getChatMember(groupId, userId)

    const chatMember = await Promise.race([chatMemberPromise, timeoutPromise])

    if (!chatMember) return false

    return ["creator", "administrator", "member"].includes(chatMember.status)
  } catch (error) {
    console.error(`Error checking if user ${userId} is member of group ${groupId}:`, error)
    return true
  }
}

// Update group info
export async function updateGroupInfo(ctx: Context, groupId: number): Promise<boolean> {
  try {
    if (!groupId) {
      console.error("Invalid group ID")
      return false
    }

    const timeoutPromise = new Promise<null>((_, reject) => {
      setTimeout(() => reject(new Error("Timeout getting chat info")), config.apiRequestTimeout)
    })

    const chatPromise = ctx.telegram.getChat(groupId)
    const memberCountPromise = ctx.telegram.getChatMembersCount(groupId)
    const botMemberPromise = ctx.telegram.getChatMember(groupId, ctx.botInfo.id)

    const [chat, memberCount, botMember] = await Promise.all([
      Promise.race([chatPromise, timeoutPromise]),
      Promise.race([memberCountPromise, Promise.resolve(0)]),
      Promise.race([botMemberPromise, Promise.resolve({ status: "unknown" })]),
    ])

    if (!chat) return false

    const groupInfo: GroupInfo = {
      id: chat.id,
      title: "title" in chat ? chat.title : `Группа ${chat.id}`,
      memberCount,
      botStatus: botMember.status,
    }

    await addBotGroup(groupInfo)
    return true
  } catch (error) {
    console.error(`Error updating group info for ${groupId}:`, error)
    return false
  }
}

// Get groups keyboard
export function getGroupsKeyboard(groups: GroupInfo[]) {
  if (!groups || !groups.length) {
    return Markup.inlineKeyboard([[Markup.button.callback("Нет доступных групп", "no_groups")]])
  }

  const buttons = groups.map((group) => [
    Markup.button.callback(group.title || `Группа ${group.id}`, `select_group_${group.id}`),
  ])

  return Markup.inlineKeyboard(buttons)
}
