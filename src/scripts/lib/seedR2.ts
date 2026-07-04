import { readFile } from "fs/promises"
import { join } from "path"
import { uploadToR2, isR2Configured } from "@/lib/storage/r2"

const MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
}

/** Upload a file from public/images to R2 under seed/{filename}. */
export async function uploadSeedImage(filename: string): Promise<string> {
  if (!isR2Configured) {
    throw new Error("R2 is not configured — set R2_* variables in .env.local")
  }

  const imagesDir = join(process.cwd(), "public", "images")
  const bytes = await readFile(join(imagesDir, filename))
  const ext = filename.split(".").pop()?.toLowerCase() ?? "jpeg"
  const contentType = MIME[ext] ?? "image/jpeg"
  const key = `seed/${filename}`

  return uploadToR2(key, bytes, contentType)
}

/** Bare filename from a local path, full URL, or legacy CDN URL. */
export function filenameFromImagePath(imagePath: string | null): string | null {
  if (!imagePath) return null
  if (!imagePath.startsWith("http")) return imagePath
  const name = imagePath.split("/").pop()
  return name || null
}
