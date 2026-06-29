"use server"

import { getSession } from "@/lib/auth/session"
import { listApprovedProfiles } from "@/lib/services/profileService"

export async function listApprovedProfilesAction() {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }
  if (!session.isApproved && session.role === "USER") {
    return { success: false, error: "PENDING_APPROVAL" }
  }

  const profiles = await listApprovedProfiles()
  return { success: true, profiles }
}
