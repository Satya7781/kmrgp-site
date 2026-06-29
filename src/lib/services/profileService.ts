import { eq, and } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, users, type Profile, type User } from "@/lib/db/schema"
import { cacheDelete, cacheDeletePattern, cacheGet, cacheSet } from "@/lib/cache"
import type { ApprovalStatus, ProfileType, PublicProfile } from "@/types"

const PROFILE_KEY = (userId: number) => `profile:${userId}`
const APPROVED_PROFILES_KEY = "profiles:approved"
const PENDING_PROFILES_KEY = "profiles:pending"

export function toPublicProfile(user: User | null, profile: Profile): PublicProfile {
  return {
    userId: profile.userId,
    username: user?.username ?? null,
    phone: user?.phone ?? null,
    type: profile.type as ProfileType,
    bio: profile.bio,
    visible: profile.visible,
    approvalStatus: profile.approvalStatus as ApprovalStatus,
    // Full URLs (R2 CDN) are used as-is; bare filenames fall back to the
    // local image API route (used by seed data and legacy local uploads).
    imageUrl: profile.imagePath
      ? profile.imagePath.startsWith("http")
        ? profile.imagePath
        : `/api/profile/image/${profile.imagePath}`
      : null,
    dob: profile.dob,
    height: profile.height,
    gotraSelf: profile.gotraSelf,
    gotraMother: profile.gotraMother,
    education: profile.education,
    profession: profile.profession,
    district: profile.district,
    community: profile.community,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    address: profile.address,
    contact: profile.contact,
    brothers: profile.brothers,
    sisters: profile.sisters,
    familyType: profile.familyType,
    parentsOccupation: profile.parentsOccupation,
  }
}

function estimateAge(dob: string | null): number {
  if (!dob || dob === "-") return 25
  try {
    const [year] = dob.split(/[-\/]/).map(Number)
    if (year > 1900) {
      return new Date().getFullYear() - year
    }
  } catch {
    // fall through
  }
  return 25
}

export async function getProfileByUserId(userId: number): Promise<(PublicProfile & { profileId: number }) | undefined> {
  const cached = cacheGet<PublicProfile & { profileId: number }>(PROFILE_KEY(userId))
  if (cached) return cached

  const rows = await db
    .select()
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.userId, userId))
    .limit(1)

  if (rows.length === 0) return undefined
  const { users: userRow, profiles: profile } = rows[0]
  const publicProfile = { ...toPublicProfile(userRow, profile), profileId: profile.id, age: estimateAge(profile.dob) }
  cacheSet(PROFILE_KEY(userId), publicProfile)
  return publicProfile
}

export async function createProfile(userId: number, data: Partial<Profile>): Promise<Profile> {
  const [profile] = await db.insert(profiles).values({ userId, ...data } as Profile).returning()
  cacheDelete(PROFILE_KEY(userId))
  cacheDelete(APPROVED_PROFILES_KEY)
  cacheDelete(PENDING_PROFILES_KEY)
  return profile
}

export async function updateProfile(userId: number, data: Partial<Profile>): Promise<Profile> {
  const [profile] = await db.update(profiles).set(data).where(eq(profiles.userId, userId)).returning()
  cacheDelete(PROFILE_KEY(userId))
  cacheDelete(APPROVED_PROFILES_KEY)
  cacheDelete(PENDING_PROFILES_KEY)
  return profile
}

export async function updateProfileImage(userId: number, imagePath: string): Promise<Profile> {
  return updateProfile(userId, { imagePath })
}

export async function updateApprovalStatus(
  userId: number,
  status: ApprovalStatus,
  visible: boolean
): Promise<Profile> {
  const [profile] = await db
    .update(profiles)
    .set({ approvalStatus: status, visible })
    .where(eq(profiles.userId, userId))
    .returning()
  cacheDelete(PROFILE_KEY(userId))
  cacheDelete(APPROVED_PROFILES_KEY)
  cacheDelete(PENDING_PROFILES_KEY)
  cacheDeletePattern("stats:")
  return profile
}

export async function listApprovedProfiles(): Promise<PublicProfile[]> {
  const cached = cacheGet<PublicProfile[]>(APPROVED_PROFILES_KEY)
  if (cached) return cached

  const rows = await db
    .select()
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(and(eq(profiles.visible, true), eq(profiles.approvalStatus, "APPROVED")))

  const result = rows.map(({ users: userRow, profiles: profile }) => ({
    ...toPublicProfile(userRow, profile),
    age: estimateAge(profile.dob),
  }))
  cacheSet(APPROVED_PROFILES_KEY, result, 1000 * 60 * 2)
  return result
}

export async function listPendingProfiles(): Promise<PublicProfile[]> {
  const cached = cacheGet<PublicProfile[]>(PENDING_PROFILES_KEY)
  if (cached) return cached

  const rows = await db
    .select()
    .from(profiles)
    .leftJoin(users, eq(profiles.userId, users.id))
    .where(eq(profiles.approvalStatus, "PENDING"))

  const result = rows.map(({ users: userRow, profiles: profile }) => toPublicProfile(userRow, profile))
  cacheSet(PENDING_PROFILES_KEY, result, 1000 * 60 * 2)
  return result
}
