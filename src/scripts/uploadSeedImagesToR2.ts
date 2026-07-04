/**
 * Upload all official seed profile photos to R2 and update imagePath in the DB
 * to the new CDN URL (R2_PUBLIC_BASE_URL).
 *
 * Run: bun run db:seed-images
 */
import { eq, inArray } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, users } from "@/lib/db/schema"
import { isR2Configured } from "@/lib/storage/r2"
import { uploadSeedImage, filenameFromImagePath } from "@/scripts/lib/seedR2"
import { OFFICIAL_GROOMS } from "@/scripts/seed"

const SEED_FILENAMES = [...new Set(OFFICIAL_GROOMS.map((g) => g.image))]

async function main() {
  if (!isR2Configured) {
    throw new Error("R2 is not configured — set R2_* variables in .env.local")
  }

  console.log("📤 Uploading seed images to R2...")

  const urlByFilename = new Map<string, string>()
  for (const filename of SEED_FILENAMES) {
    const url = await uploadSeedImage(filename)
    urlByFilename.set(filename, url)
    console.log(`  ✓ ${filename} → ${url}`)
  }

  console.log("\n🔄 Updating profile imagePath in database...")

  let updated = 0
  try {
    for (const groom of OFFICIAL_GROOMS) {
      const cdnUrl = urlByFilename.get(groom.image)
      if (!cdnUrl) continue

      const [user] = await db.select().from(users).where(eq(users.phone, groom.phone)).limit(1)
      if (!user) {
        console.warn(`  ⚠ No user for ${groom.username} (${groom.phone})`)
        continue
      }

      await db.update(profiles).set({ imagePath: cdnUrl }).where(eq(profiles.userId, user.id))
      console.log(`  ✓ ${groom.username}`)
      updated++
    }

    const seedProfileRows = await db
      .select({ id: profiles.id, imagePath: profiles.imagePath, userId: profiles.userId })
      .from(profiles)
      .where(inArray(profiles.imagePath, SEED_FILENAMES))

    for (const row of seedProfileRows) {
      const filename = row.imagePath!
      const cdnUrl = urlByFilename.get(filename)
      if (!cdnUrl) continue
      await db.update(profiles).set({ imagePath: cdnUrl }).where(eq(profiles.id, row.id))
      updated++
    }

    const allRows = await db.select({ id: profiles.id, imagePath: profiles.imagePath }).from(profiles)
    for (const row of allRows) {
      const filename = filenameFromImagePath(row.imagePath)
      if (!filename || !urlByFilename.has(filename)) continue
      const cdnUrl = urlByFilename.get(filename)!
      if (row.imagePath === cdnUrl) continue
      await db.update(profiles).set({ imagePath: cdnUrl }).where(eq(profiles.id, row.id))
      console.log(`  ✓ migrated legacy URL → ${filename}`)
      updated++
    }

    console.log(`\n✅ Done. ${SEED_FILENAMES.length} images on CDN, ${updated} profile row(s) updated.`)
  } catch (err) {
    console.error("\n⚠️ Images uploaded to R2 but database update failed (is Postgres running?).")
    console.error("   Start Docker with: npm run docker:up")
    console.error("   Then re-run: bun run db:seed-images")
    throw err
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
