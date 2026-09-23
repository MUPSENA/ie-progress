import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { rollupSchedule } from "@/lib/schedule";
import { isPastScheduleDate } from "@/lib/domain";

const schema = z.object({ progress: z.number().int().min(0).max(100).optional(), currentStart: z.string().optional(), currentEnd: z.string().optional(), reason: z.string().trim().optional() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(["ADMIN", "WORKER"]);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new Error("VALIDATION:更新内容を確認してください");
    const { id } = await context.params;
    const item = await db.scheduleItem.findFirst({ where: { id, deletedAt: null } });
    if (!item) return NextResponse.json({ error: "工程が見つかりません" }, { status: 404 });
    await assertProjectAccess(user, item.projectId);
    const changingDates = parsed.data.currentStart || parsed.data.currentEnd;
    if (changingDates && user.role !== "ADMIN") throw new Error("PROJECT_FORBIDDEN");
    if (changingDates && (!parsed.data.reason || parsed.data.reason.length < 3)) throw new Error("VALIDATION:予定変更の理由を3文字以上で入力してください");
    if (user.role === "WORKER" && item.level !== "DAY") throw new Error("PROJECT_FORBIDDEN");
    const currentStart = parsed.data.currentStart ? new Date(`${parsed.data.currentStart}T09:00:00+09:00`) : item.currentStart;
    const currentEnd = parsed.data.currentEnd ? new Date(`${parsed.data.currentEnd}T18:00:00+09:00`) : item.currentEnd;
    if (currentEnd < currentStart) throw new Error("VALIDATION:終了日は開始日以降にしてください");
    const progress = parsed.data.progress ?? item.progress;
    const status = progress === 100 ? "DONE" : isPastScheduleDate(currentEnd) && progress < 100 ? "DELAYED" : progress > 0 ? "IN_PROGRESS" : "NOT_STARTED";
    const updated = await db.$transaction(async (tx) => {
      if (changingDates) await tx.scheduleChange.create({ data: { projectId: item.projectId, scheduleItemId: id, changedById: user.id, previousStart: item.currentStart, previousEnd: item.currentEnd, newStart: currentStart, newEnd: currentEnd, reason: parsed.data.reason! } });
      return tx.scheduleItem.update({ where: { id }, data: { progress, status, currentStart, currentEnd } });
    });
    if (item.level === "DAY") await rollupSchedule(id);
    await audit(user.id, "UPDATE_SCHEDULE", "ScheduleItem", id, { progress: item.progress, currentStart: item.currentStart, currentEnd: item.currentEnd }, { progress: updated.progress, currentStart: updated.currentStart, currentEnd: updated.currentEnd, reason: parsed.data.reason });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
