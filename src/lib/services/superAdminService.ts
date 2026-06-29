import { createUser, listAdmins, updateUserRole, deleteUser, countUsers, countApprovedUsers, countAdmins } from "./userService"
import { listLogs } from "./auditLogService"
import { listPendingProfiles } from "./profileService"
import type { SuperAdminStats, PublicProfile, User } from "@/types"

export async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const totalUsers = await countUsers()
  const approvedUsers = await countApprovedUsers()
  const pending = await listPendingProfiles()
  const totalAdmins = await countAdmins()
  const logs = await listLogs(1000)

  return {
    totalUsers,
    approvedUsers,
    pendingApprovals: pending.length,
    totalAdmins,
    totalActions: logs.length,
    approvedCount: logs.filter((l) => l.actionType === "APPROVE").length,
    rejectedCount: logs.filter((l) => l.actionType === "REJECT").length,
    deletedCount: logs.filter((l) => l.actionType === "DELETE").length,
  }
}

export async function getAdminAccounts(): Promise<User[]> {
  return listAdmins()
}

export async function createAdminAccount(phone: string, username: string, password: string): Promise<User> {
  return createUser({ phone, username, password, role: "ADMIN", isApproved: true })
}

export async function demoteAdminToUser(userId: number): Promise<User> {
  return updateUserRole(userId, "USER")
}

export async function removeAdminAccount(userId: number): Promise<void> {
  await deleteUser(userId)
}
