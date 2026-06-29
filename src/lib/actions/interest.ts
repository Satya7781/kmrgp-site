"use server"

import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth/session"
import {
  getReceivedInterests,
  sendInterest,
  updateInterestStatus,
  countReceivedInterests,
} from "@/lib/services/interestService"

export async function getMyInterestsAction() {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }
  const interests = await getReceivedInterests(session.id)
  const count = await countReceivedInterests(session.id)
  return { success: true, interests, count }
}

export async function sendInterestAction(receiverId: number) {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }
  await sendInterest(session.id, receiverId)
  revalidatePath("/profiles")
  return { success: true }
}

export async function acceptInterestAction(interestId: number) {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }
  await updateInterestStatus(interestId, session.id, "ACCEPTED")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function declineInterestAction(interestId: number) {
  const session = await getSession()
  if (!session) return { success: false, error: "Not authenticated" }
  await updateInterestStatus(interestId, session.id, "DECLINED")
  revalidatePath("/dashboard")
  return { success: true }
}
