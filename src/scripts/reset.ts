import { sql } from "drizzle-orm"
import { db } from "@/lib/db"

async function reset() {
  console.log("⚠️ Dropping all tables...")
  await db.execute(sql`
    DROP TABLE IF EXISTS interests CASCADE;
    DROP TABLE IF EXISTS admin_action_logs CASCADE;
    DROP TABLE IF EXISTS profiles CASCADE;
    DROP TABLE IF EXISTS users CASCADE;
  `)
  console.log("✅ Database reset.")
}

reset().catch((err) => {
  console.error(err)
  process.exit(1)
})
