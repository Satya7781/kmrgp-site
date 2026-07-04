import { eq, and, isNull } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { updateUserApproval } from "./userService"
import { updateApprovalStatus } from "./profileService"
import { deleteUser } from "./userService"
import { logAction } from "./auditLogService"
import { cacheDeletePattern } from "@/lib/cache"
import {
  updateProfilePublicDisplay as updateProfilePublicDisplayRow,
  hideAllSeedProfiles as hideAllSeedProfilesRows,
} from "./profileService"

export interface ApproveUserOptions {
  showPublic?: boolean
  featureOnHome?: boolean
}

export async function approveUser(adminId: number, targetUserId: number, options?: ApproveUserOptions) {
  const showPublic = options?.showPublic ?? true
  const featureOnHome = options?.featureOnHome ?? false
  await updateUserApproval(targetUserId, true)
  await updateApprovalStatus(targetUserId, "APPROVED", showPublic, featureOnHome)
  await logAction(adminId, "APPROVE", targetUserId)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

export async function rejectUser(adminId: number, targetUserId: number) {
  await updateUserApproval(targetUserId, false)
  await updateApprovalStatus(targetUserId, "REJECTED", false, false)
  await logAction(adminId, "REJECT", targetUserId)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

/**
 * Soft-delete a user. The user row is retained (deletedAt set) for audit and
 * recovery, and their profile is hidden so it stops appearing in matches.
 * Interests are left intact (referenced by audit logs via onDelete: set null
 * only on hard delete, which we no longer perform).
 */
export async function deleteUserAsAdmin(adminId: number, targetUserId: number) {
  await logAction(adminId, "DELETE", targetUserId)
  // Hide the profile first so it disappears from approved listings immediately.
  await db
    .update(profiles)
    .set({ visible: false, featured: false, approvalStatus: "REJECTED" })
    .where(eq(profiles.userId, targetUserId))
  await deleteUser(targetUserId)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

export async function setProfilePublicDisplay(
  adminId: number,
  targetUserId: number,
  patch: { visible?: boolean; featured?: boolean }
) {
  await updateProfilePublicDisplayRow(targetUserId, patch)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

export async function hideAllSeedProfiles(adminId: number) {
  const count = await hideAllSeedProfilesRows()
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
  return count
}