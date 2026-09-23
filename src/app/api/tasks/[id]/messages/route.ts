import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const parsed = z.object({ body: z.string().trim().min(1).max(2000) }).safeParse(await request.json());
    if (!parsed.success) throw new Error("VALIDATION:返信内容を入力してください");
    const { id } = await context.params;
    const task = await db.task.findFirst({ where: { id, deletedAt: null } });
    if (!task) return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
    await assertProjectAccess(user, task.projectId);
    if (user.role === "OWNER" && (task.type !== "OWNER_QUESTION" || task.creatorId !== user.id)) throw new Error("PROJECT_FORBIDDEN");
    if (user.role === "WORKER" && task.creatorId !== user.id && task.assignedToId !== user.id) throw new Error("PROJECT_FORBIDDEN");
    const message = await db.taskMessage.create({ data: { taskId: id, authorId: user.id, body: parsed.data.body } });
    const nextStatus = task.type === "OWNER_QUESTION" && user.role !== "OWNER" ? "ANSWERED" : task.status;
    await db.task.update({ where: { id }, data: { status: nextStatus, unreadForAdmin: user.role !== "ADMIN", unreadForAssignee: task.assignedToId !== user.id, unreadForCreator: task.creatorId !== user.id } });
    const notifyUserId = user.id === task.creatorId ? task.assignedToId : task.creatorId;
    if (notifyUserId) await db.notification.create({ data: { userId: notifyUserId, title: "タスクに返信がありました", body: parsed.data.body.slice(0, 80), href: "/dashboard?tab=tasks" } });
    await audit(user.id, "ADD_TASK_MESSAGE", "TaskMessage", message.id, undefined, { taskId: id });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
