import { updateUserApproval } from "./userService"
import { updateApprovalStatus } from "./profileService"
import { deleteUser } from "./userService"
import { logAction } from "./auditLogService"
import { cacheDeletePattern } from "@/lib/cache"
import type { ActionType } from "@/types"

export async function approveUser(adminId: number, targetUserId: number) {
  await updateUserApproval(targetUserId, true)
  await updateApprovalStatus(targetUserId, "APPROVED", true)
  await logAction(adminId, "APPROVE", targetUserId)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

export async function rejectUser(adminId: number, targetUserId: number) {
  await updateUserApproval(targetUserId, false)
  await updateApprovalStatus(targetUserId, "REJECTED", false)
  await logAction(adminId, "REJECT", targetUserId)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}

export async function deleteUserAsAdmin(adminId: number, targetUserId: number) {
  await logAction(adminId, "DELETE", targetUserId)
  await deleteUser(targetUserId)
  cacheDeletePattern("profiles:")
  cacheDeletePattern("stats:")
}
