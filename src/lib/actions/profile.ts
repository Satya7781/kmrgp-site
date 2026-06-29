"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth/session"
import { getProfileByUserId, updateProfile } from "@/lib/services/profileService"

export async function getMyProfile() {
  const session = await getSession()
  if (!session) return null
  return getProfileByUserId(session.id)
}

export async function updateMyProfile(data: {
  username?: string
  bio?: string
  dob?: string
  height?: string
  gotraSelf?: string
  gotraMother?: string
  education?: string
  profession?: string
  district?: string
  community?: string
  fatherName?: string
  motherName?: string
  address?: string
  contact?: string
  brothers?: string
  sisters?: string
  familyType?: string
  parentsOccupation?: string
}) {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }

  const profile = await getProfileByUserId(session.id)
  if (!profile) return { success: false, error: "Profile not found" }
  if (profile.approvalStatus === "APPROVED" && session.role === "USER") {
    return { success: false, error: "Approved profiles cannot be edited." }
  }

  await updateProfile(session.id, {
    ...data,
  })
  revalidatePath("/dashboard")
  return { success: true }
}

export async function requestApprovalAction() {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }

  const profile = await getProfileByUserId(session.id)
  if (!profile) return { success: false, error: "Profile not found" }
  if (profile.approvalStatus !== "SENT") {
    return { success: false, error: "Approval has already been requested." }
  }

  await updateProfile(session.id, { approvalStatus: "PENDING" })
  revalidatePath("/dashboard")
  return { success: true }
}
