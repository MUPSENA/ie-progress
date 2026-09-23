import { db } from "@/lib/db";
import { calculateRollup } from "@/lib/domain";

export async function rollupSchedule(dayId: string) {
  let current = await db.scheduleItem.findUnique({ where: { id: dayId }, select: { parentId: true } });
  while (current?.parentId) {
    const parentId = current.parentId;
    const children = await db.scheduleItem.findMany({ where: { parentId, deletedAt: null }, select: { progress: true, status: true, currentEnd: true } });
    if (!children.length) break;
    const rollup = calculateRollup(children);
    if (!rollup) break;
    current = await db.scheduleItem.update({ where: { id: parentId }, data: rollup, select: { parentId: true } });
  }
}
