import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";

const schema = z.object({
  type: z.enum(["OWNER_QUESTION", "SITE_REQUEST"]),
  projectId: z.string().min(1),
  scheduleItemId: z.string().optional().nullable(),
  targetReportId: z.string().optional().nullable(),
  title: z.string().trim().min(2).max(100),
  content: z.string().trim().min(2).max(2000),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  dueAt: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await requireUser(["OWNER", "WORKER"]);
    const multipart = request.headers.get("content-type")?.includes("multipart/form-data");
    const form = multipart ? await request.formData() : null;
    const input = form ? {
      type: String(form.get("type") ?? ""), projectId: String(form.get("projectId") ?? ""),
      scheduleItemId: String(form.get("scheduleItemId") ?? "") || null, targetReportId: String(form.get("targetReportId") ?? "") || null,
      title: String(form.get("title") ?? ""), content: String(form.get("content") ?? ""), priority: String(form.get("priority") ?? "NORMAL"),
      dueAt: String(form.get("dueAt") ?? "") || null,
    } : await request.json();
    const parsed = schema.safeParse(input);
    if (!parsed.success) throw new Error("VALIDATION:入力内容を確認してください");
    const data = parsed.data;
    if ((user.role === "OWNER" && data.type !== "OWNER_QUESTION") || (user.role === "WORKER" && data.type !== "SITE_REQUEST")) throw new Error("PROJECT_FORBIDDEN");
    await assertProjectAccess(user, data.projectId);
    if (data.type === "OWNER_QUESTION") {
      if (!data.targetReportId) throw new Error("VALIDATION:質問対象の報告を選択してください");
      const report = await db.report.findFirst({ where: { id: data.targetReportId, projectId: data.projectId, approvalStatus: "APPROVED", deletedAt: null } });
      if (!report) throw new Error("PROJECT_FORBIDDEN");
    }
    if (data.scheduleItemId) {
      const schedule = await db.scheduleItem.findFirst({ where: { id: data.scheduleItemId, projectId: data.projectId, deletedAt: null } });
      if (!schedule) throw new Error("VALIDATION:関連工程が見つかりません");
    }
    const photo = form?.get("photo");
    let photoData: { storageKey: string; mimeType: string; byteSize: number; originalName: string; capturedAt: Date } | undefined;
    if (photo instanceof File && photo.size > 0) {
      const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
      if (!allowed.has(photo.type) || photo.size > 6 * 1024 * 1024) throw new Error("VALIDATION:JPEG・PNG・WebP・HEICの6MB以下の写真を使用してください");
      const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : photo.type.includes("heic") || photo.type.includes("heif") ? "heic" : "jpg";
      const storageKey = `${randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "data", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, storageKey), Buffer.from(await photo.arrayBuffer()));
      photoData = { storageKey, mimeType: photo.type, byteSize: photo.size, originalName: photo.name || "依頼写真", capturedAt: new Date() };
    }
    const admin = await db.user.findFirst({ where: { role: "ADMIN", active: true, deletedAt: null }, orderBy: { createdAt: "asc" } });
    const task = await db.task.create({
      data: {
        type: data.type, projectId: data.projectId, scheduleItemId: data.scheduleItemId || null, targetReportId: data.targetReportId || null,
        creatorId: user.id, assignedToId: admin?.id, title: data.title, content: data.content, trade: user.trade,
        priority: data.priority, status: data.type === "OWNER_QUESTION" ? "QUESTIONING" : "UNCHECKED",
        dueAt: data.dueAt ? new Date(`${data.dueAt}T17:00:00+09:00`) : null, unreadForAdmin: true,
        messages: { create: { authorId: user.id, body: data.content } },
        ...(photoData ? { photos: { create: photoData } } : {}),
      },
    });
    if (admin) await db.notification.create({ data: { userId: admin.id, title: data.type === "OWNER_QUESTION" ? "施主からの新しい質問" : "現場からの新しい依頼", body: data.title, href: "/dashboard?tab=tasks" } });
    await audit(user.id, "CREATE_TASK", "Task", task.id, undefined, { type: task.type, title: task.title });
    return NextResponse.json({ ok: true, id: task.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
