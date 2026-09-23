import { db } from "@/lib/db";

export async function audit(userId: string | null, action: string, entityType: string, entityId: string, before?: unknown, after?: unknown, ipAddress?: string | null) {
  await db.auditLog.create({ data: { userId, action, entityType, entityId, beforeJson: before === undefined ? null : JSON.stringify(before), afterJson: after === undefined ? null : JSON.stringify(after), ipAddress: ipAddress ?? null } });
}
