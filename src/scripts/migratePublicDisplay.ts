/**
 * Add is_seed + featured columns and mark official seed users.
 * Run: bun run db:migrate-public-display
 */
import { sql } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, profiles } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { OFFICIAL_GROOMS } from "@/scripts/seed"

const SEED_PHONES = OFFICIAL_GROOMS.map((g) => g.phone)

async function main() {
  console.log("Applying public-display schema...")

  await db.execute(sql`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS is_seed boolean NOT NULL DEFAULT false;
  `)
  await db.execute(sql`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS profiles_featured_idx ON profiles (featured);
  `)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS profiles_is_seed_idx ON profiles (is_seed);
  `)

  const seedUsers = await db
    .select({ id: users.id, phone: users.phone })
    .from(users)
    .where(inArray(users.phone, SEED_PHONES))

  const featuredPhones = new Set(SEED_PHONES.slice(0, 3))

  for (const user of seedUsers) {
    await db
      .update(profiles)
      .set({
        isSeed: true,
        featured: featuredPhones.has(user.phone),
      })
      .where(eq(profiles.userId, user.id))
    console.log(`  ✓ marked seed: ${user.phone}`)
  }

  console.log("✅ Migration complete.")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
