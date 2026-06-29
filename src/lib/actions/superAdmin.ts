"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth/session"
import {
  getSuperAdminStats,
  getAdminAccounts,
  createAdminAccount,
  demoteAdminToUser,
} from "@/lib/services/superAdminService"

export async function getSuperAdminStatsAction() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return { success: false, error: "Forbidden" }
  }
  const stats = await getSuperAdminStats()
  return { success: true, stats }
}

export async function listAdminsAction() {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return { success: false, error: "Forbidden" }
  }
  const admins = await getAdminAccounts()
  return { success: true, admins }
}

export async function createAdminAction(name: string, phone: string, password: string) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return { success: false, error: "Forbidden" }
  }
  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters." }
  }
  if (phone.replace(/\D/g, "").length < 10) {
    return { success: false, error: "Phone must be at least 10 digits." }
  }
  const admin = await createAdminAccount(phone, name, password)
  revalidatePath("/dashboard")
  return { success: true, admin }
}

export async function demoteAdminAction(userId: number) {
  const session = await getSession()
  if (!session || session.role !== "SUPER_ADMIN") {
    return { success: false, error: "Forbidden" }
  }
  await demoteAdminToUser(userId)
  revalidatePath("/dashboard")
  return { success: true }
}
