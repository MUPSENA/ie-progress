import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";

const schema = z.object({ status: z.enum(["QUESTIONING", "ANSWERED", "RESOLVED", "UNCHECKED", "IN_PROGRESS", "WAITING", "COMPLETED", "RETURNED"]).optional(), assignedToId: z.string().nullable().optional() });

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success || (!parsed.data.status && parsed.data.assignedToId === undefined)) throw new Error("VALIDATION:更新内容を確認してください");
    const { id } = await context.params;
    const task = await db.task.findFirst({ where: { id, deletedAt: null } });
    if (!task) return NextResponse.json({ error: "タスクが見つかりません" }, { status: 404 });
    await assertProjectAccess(user, task.projectId);
    if (user.role === "OWNER" && (task.type !== "OWNER_QUESTION" || task.creatorId !== user.id || parsed.data.status !== "RESOLVED" || parsed.data.assignedToId !== undefined)) throw new Error("PROJECT_FORBIDDEN");
    if (user.role === "WORKER" && task.assignedToId !== user.id && task.creatorId !== user.id) throw new Error("PROJECT_FORBIDDEN");
    if (parsed.data.assignedToId !== undefined && user.role !== "ADMIN") throw new Error("PROJECT_FORBIDDEN");
    if (parsed.data.assignedToId) {
      const assignee = await db.user.findFirst({ where: { id: parsed.data.assignedToId, role: { in: ["ADMIN", "WORKER"] }, active: true } });
      if (!assignee) throw new Error("VALIDATION:担当者が見つかりません");
    }
    const updated = await db.task.update({ where: { id }, data: { status: parsed.data.status, assignedToId: parsed.data.assignedToId, unreadForAdmin: user.role === "ADMIN" ? false : true, unreadForCreator: user.id !== task.creatorId } });
    await audit(user.id, "UPDATE_TASK", "Task", id, { status: task.status, assignedToId: task.assignedToId }, { status: updated.status, assignedToId: updated.assignedToId });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
