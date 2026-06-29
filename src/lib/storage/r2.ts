import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3"

/**
 * Cloudflare R2 storage service (S3-compatible).
 *
 * Uploaded profile photos are stored in R2 and served via the public CDN
 * domain (R2_PUBLIC_BASE_URL). Seed images that ship in /public/images are
 * NOT uploaded to R2 — they continue to be served from the local filesystem
 * by the image route.
 */

const accountId = process.env.R2_ACCOUNT_ID!
const accessKeyId = process.env.R2_ACCESS_KEY_ID!
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!
const bucket = process.env.R2_BUCKET!
const endpoint = process.env.R2_ENDPOINT!
export const r2PublicBaseUrl = process.env.R2_PUBLIC_BASE_URL!

export const isR2Configured = Boolean(
  accountId && accessKeyId && secretAccessKey && bucket && endpoint && r2PublicBaseUrl
)

let client: S3Client | null = null

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: false,
    })
  }
  return client
}

/**
 * Upload a file to R2 and return the public CDN URL.
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  const s3 = getClient()
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  )
  return `${r2PublicBaseUrl}/${key}`
}

/**
 * Delete an object from R2 by key. Silently ignores missing objects.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const s3 = getClient()
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
  } catch {
    // ignore — best-effort cleanup
  }
}

/**
 * Fetch an object from R2 by key. Returns undefined if not found.
 */
export async function getFromR2(
  key: string
): Promise<{ body: Uint8Array; contentType: string } | undefined> {
  const s3 = getClient()
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    if (!response.Body) return undefined

    const body = await response.Body.transformToByteArray()
    return {
      body,
      contentType: response.ContentType || "application/octet-stream",
    }
  } catch {
    return undefined
  }
}

/**
 * Check whether an object exists in R2.
 */
export async function existsInR2(key: string): Promise<boolean> {
  const s3 = getClient()
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    )
    return true
  } catch {
    return false
  }
}

/**
 * Build the public CDN URL for a given R2 key.
 */
export function r2Url(key: string): string {
  return `${r2PublicBaseUrl}/${key}`
}

/**
 * Extract the R2 object key from a full CDN URL or return the input as-is
 * if it is already a bare key.
 */
export function keyFromUrl(url: string): string {
  if (url.startsWith(r2PublicBaseUrl)) {
    return url.slice(r2PublicBaseUrl.length + 1)
  }
  return url
}