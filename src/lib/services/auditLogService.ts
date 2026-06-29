import { eq, desc } from "drizzle-orm"
import { db } from "@/lib/db"
import { adminActionLogs, type AdminActionLog } from "@/lib/db/schema"
import type { ActionType } from "@/types"

export async function logAction(adminId: number, actionType: ActionType, targetUserId: number): Promise<AdminActionLog> {
  const [log] = await db
    .insert(adminActionLogs)
    .values({ adminId, actionType, targetUserId })
    .returning()
  return log
}

export async function listLogs(limit = 100): Promise<AdminActionLog[]> {
  return db.select().from(adminActionLogs).orderBy(desc(adminActionLogs.timestamp)).limit(limit)
}
