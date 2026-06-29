import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { getFromR2, isR2Configured } from "@/lib/storage/r2"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads")
const IMAGES_DIR = join(process.cwd(), "public", "images")

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Prevent path traversal
  if (filename.includes("..") || filename.includes("/")) {
    return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
  }

  const ext = filename.split(".").pop()?.toLowerCase() || "jpg"
  const contentType =
    ext === "png" ? "image/png" : ext === "gif" ? "image/gif" : ext === "webp" ? "image/webp" : "image/jpeg"

  // 1. Try Cloudflare R2 (user-uploaded images live here)
  if (isR2Configured) {
    const r2Object = await getFromR2(filename)
    if (r2Object) {
      return new NextResponse(Buffer.from(r2Object.body), {
        headers: {
          "Content-Type": r2Object.contentType || contentType,
          "Cache-Control": "public, max-age=2592000, immutable",
        },
      })
    }
  }

  // 2. Fallback to local filesystem (uploads dir, then seed images dir)
  for (const dir of [UPLOAD_DIR, IMAGES_DIR]) {
    try {
      const data = await readFile(join(dir, filename))
      return new NextResponse(data, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=2592000, immutable",
        },
      })
    } catch {
      // try next dir
    }
  }

  return NextResponse.json({ error: "Image not found" }, { status: 404 })
}
