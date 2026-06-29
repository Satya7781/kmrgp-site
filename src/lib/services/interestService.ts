import { eq, and, count } from "drizzle-orm"
import { db } from "@/lib/db"
import { interests, users, profiles, type Interest, type User, type Profile } from "@/lib/db/schema"
import { cacheDeletePattern, cacheGet, cacheSet } from "@/lib/cache"
import type { InterestStatus } from "@/types"

const RECEIVED_KEY = (receiverId: number) => `interests:received:${receiverId}`

interface InterestRow {
  interests: Interest
  users: User | null
  profiles: Profile | null
}

export async function getReceivedInterests(receiverId: number) {
  const cached = cacheGet(RECEIVED_KEY(receiverId))
  if (cached) return cached

  const rows = (await db
    .select()
    .from(interests)
    .leftJoin(users, eq(interests.senderId, users.id))
    .leftJoin(profiles, eq(interests.senderId, profiles.userId))
    .where(eq(interests.receiverId, receiverId))) as InterestRow[]

  const result = rows.map((row) => ({
    id: row.interests.id,
    senderId: row.interests.senderId,
    senderName: row.users?.username ?? "Unknown",
    senderImage: row.profiles?.imagePath ? `/api/profile/image/${row.profiles.imagePath}` : null,
    senderType: row.profiles?.type ?? "GROOM",
    age: row.profiles?.dob ? estimateAge(row.profiles.dob) : null,
    gotraSelf: row.profiles?.gotraSelf,
    gotraMother: row.profiles?.gotraMother,
    district: row.profiles?.district,
    status: row.interests.status,
  }))

  cacheSet(RECEIVED_KEY(receiverId), result)
  return result
}

function estimateAge(dob: string | null): number {
  if (!dob || dob === "-") return 25
  try {
    const [year] = dob.split(/[-\/]/).map(Number)
    if (year > 1900) return new Date().getFullYear() - year
  } catch {}
  return 25
}

export async function countReceivedInterests(receiverId: number): Promise<number> {
  const rows = await db.select({ count: count() }).from(interests).where(eq(interests.receiverId, receiverId))
  return Number(rows[0].count)
}

export async function sendInterest(senderId: number, receiverId: number): Promise<Interest | undefined> {
  const [interest] = await db
    .insert(interests)
    .values({ senderId, receiverId })
    .onConflictDoNothing()
    .returning()
  cacheDeletePattern(`interests:received:${receiverId}`)
  return interest
}

export async function updateInterestStatus(
  interestId: number,
  receiverId: number,
  status: InterestStatus
): Promise<Interest | undefined> {
  const [interest] = await db
    .update(interests)
    .set({ status })
    .where(and(eq(interests.id, interestId), eq(interests.receiverId, receiverId)))
    .returning()
  cacheDeletePattern(`interests:received:${receiverId}`)
  return interest
}
