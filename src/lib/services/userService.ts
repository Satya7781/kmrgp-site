import { eq, sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, type User } from "@/lib/db/schema"
import { cacheDelete, cacheDeletePattern, cacheGet, cacheSet } from "@/lib/cache"
import { hashPassword } from "@/lib/auth/password"
import type { Role } from "@/types"

const USER_KEY = (id: number) => `user:${id}`
const USER_PHONE_KEY = (phone: string) => `user:phone:${phone}`

export async function getUserById(id: number): Promise<User | undefined> {
  const cached = cacheGet<User>(USER_KEY(id))
  if (cached) return cached

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1)
  if (user) cacheSet(USER_KEY(id), user)
  return user
}

export async function getUserByPhone(phone: string): Promise<User | undefined> {
  const normalized = phone.replace(/\D/g, "")
  const cached = cacheGet<User>(USER_PHONE_KEY(normalized))
  if (cached) return cached

  const [user] = await db.select().from(users).where(eq(users.phone, normalized)).limit(1)
  if (user) cacheSet(USER_PHONE_KEY(normalized), user)
  return user
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  return user
}

export async function createUser(data: {
  phone: string
  username: string | null
  password: string
  role?: Role
  isApproved?: boolean
}): Promise<User> {
  const passwordHash = await hashPassword(data.password)
  const [user] = await db
    .insert(users)
    .values({
      phone: data.phone.replace(/\D/g, ""),
      username: data.username,
      passwordHash,
      role: data.role ?? "USER",
      isApproved: data.isApproved ?? false,
    })
    .returning()

  cacheSet(USER_KEY(user.id), user)
  cacheSet(USER_PHONE_KEY(user.phone), user)
  cacheDeletePattern("stats:")
  return user
}

export async function updateUserApproval(id: number, isApproved: boolean): Promise<User> {
  const [user] = await db.update(users).set({ isApproved }).where(eq(users.id, id)).returning()
  cacheSet(USER_KEY(id), user)
  cacheSet(USER_PHONE_KEY(user.phone), user)
  cacheDeletePattern("stats:")
  return user
}

export async function updateUserRole(id: number, role: Role): Promise<User> {
  const [user] = await db.update(users).set({ role }).where(eq(users.id, id)).returning()
  cacheSet(USER_KEY(id), user)
  cacheSet(USER_PHONE_KEY(user.phone), user)
  cacheDeletePattern("stats:")
  return user
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id))
  cacheDelete(USER_KEY(id))
  cacheDeletePattern("user:")
  cacheDeletePattern("profile:")
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

export async function listAdmins(): Promise<User[]> {
  return db.select().from(users).where(eq(users.role, "ADMIN"))
}

export async function countUsers(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "USER"))
  return count
}

export async function countApprovedUsers(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(sql`${users.role} = 'USER' AND ${users.isApproved} = true`)
  return count
}

export async function countAdmins(): Promise<number> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(eq(users.role, "ADMIN"))
  return count
}
