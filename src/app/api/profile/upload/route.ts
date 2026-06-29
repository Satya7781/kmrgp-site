import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { updateProfileImage, getProfileByUserId } from "@/lib/services/profileService"
import { uploadToR2, deleteFromR2, isR2Configured, keyFromUrl } from "@/lib/storage/r2"
import { writeFile, mkdir, unlink } from "fs/promises"
import { join } from "path"
import { randomBytes } from "crypto"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")

export async function POST(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 })
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
  }

  if (file.size > 30 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || "jpg"
  const filename = `upload_${randomBytes(8).toString("hex")}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  const profile = await getProfileByUserId(session.id)

  // Delete old image if present
  if (profile?.imageUrl) {
    const oldUrl = profile.imageUrl
    // R2-hosted images (full CDN URL) → delete from R2
    if (oldUrl.startsWith("http")) {
      try {
        await deleteFromR2(keyFromUrl(oldUrl))
      } catch {
        // ignore — best-effort cleanup
      }
    } else {
      // Local-hosted legacy image (/api/profile/image/<file>)
      try {
        const oldFilename = oldUrl.split("/").pop()
        if (oldFilename) {
          await unlink(join(UPLOAD_DIR, oldFilename)).catch(() => {})
        }
      } catch {
        // ignore
      }
    }
  }

  let imageUrl: string
  let imagePath: string

  if (isR2Configured) {
    // Upload to Cloudflare R2 — served via public CDN domain
    imageUrl = await uploadToR2(filename, bytes, file.type)
    // Store the full CDN URL so toPublicProfile serves it directly
    imagePath = imageUrl
  } else {
    // Fallback: write to local disk (dev without R2 configured)
    await mkdir(UPLOAD_DIR, { recursive: true })
    await writeFile(join(UPLOAD_DIR, filename), bytes)
    imageUrl = `/api/profile/image/${filename}`
    imagePath = filename
  }

  await updateProfileImage(session.id, imagePath)

  return NextResponse.json({ success: true, imageUrl }, { status: 201 })
}
