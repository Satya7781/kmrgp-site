"use server"

import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import type { SessionUser, Role } from "@/types"

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function createSession(userId: number, role: Role, phone: string, username: string | null, isApproved: boolean) {
  const token = await new SignJWT({ userId, role, phone, username, isApproved })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret)

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return token
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("session")?.value
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] })
    return payload as unknown as SessionUser
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
