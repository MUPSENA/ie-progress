import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { assertProjectAccess } from "@/lib/access";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";
import { rollupSchedule } from "@/lib/schedule";
import { isPastScheduleDate } from "@/lib/domain";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

export async function POST(request: Request) {
  try {
    const user = await requireUser(["WORKER"]);
    const form = await request.formData();
    const projectId = String(form.get("projectId") ?? "");
    const scheduleItemId = String(form.get("scheduleItemId") ?? "");
    const comment = String(form.get("comment") ?? "").trim();
    const progress = Number(form.get("progress"));
    const capturedAt = new Date(String(form.get("capturedAt") ?? new Date().toISOString()));
    if (!projectId || !scheduleItemId || comment.length < 2 || !Number.isInteger(progress) || progress < 0 || progress > 100 || Number.isNaN(capturedAt.getTime())) throw new Error("VALIDATION:入力内容を確認してください");
    await assertProjectAccess(user, projectId);
    const schedule = await db.scheduleItem.findFirst({ where: { id: scheduleItemId, projectId, level: "DAY", deletedAt: null } });
    if (!schedule) throw new Error("VALIDATION:日工程が見つかりません");
    const file = form.get("photo");
    if (!(file instanceof File) || file.size === 0) throw new Error("VALIDATION:写真を選択してください");
    if (!allowedTypes.has(file.type) || file.size > 6 * 1024 * 1024) throw new Error("VALIDATION:JPEG・PNG・WebP・HEICの6MB以下の写真を使用してください");

    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type.includes("heic") || file.type.includes("heif") ? "heic" : "jpg";
    const storageKey = `${randomUUID()}.${ext}`;
    const uploadDir = path.join(process.cwd(), "data", "uploads");
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, storageKey), Buffer.from(await file.arrayBuffer()));

    const report = await db.report.create({
      data: {
        projectId, scheduleItemId, authorId: user.id, comment, progress, capturedAt,
        photos: { create: { storageKey, mimeType: file.type, byteSize: file.size, originalName: file.name || "現場写真", capturedAt } },
      }, include: { photos: true },
    });
    const status = progress === 100 ? "DONE" : progress > 0 ? (isPastScheduleDate(schedule.currentEnd) ? "DELAYED" : "IN_PROGRESS") : "NOT_STARTED";
    await db.scheduleItem.update({ where: { id: scheduleItemId }, data: { progress, status } });
    await rollupSchedule(scheduleItemId);
    const admins = await db.user.findMany({ where: { role: "ADMIN", active: true }, select: { id: true } });
    if (admins.length) await db.notification.createMany({ data: admins.map((admin) => ({ userId: admin.id, title: "新しい現場報告", body: `${user.name}さんから承認待ちの報告があります`, href: "/dashboard?tab=approvals" })) });
    await audit(user.id, "CREATE_REPORT", "Report", report.id, undefined, { projectId, scheduleItemId, progress });
    return NextResponse.json({ ok: true, id: report.id }, { status: 201 });
  } catch (error) { return apiError(error); }
}
