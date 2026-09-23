import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("reject"), reason: z.string().trim().min(3).max(500) }),
]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(["ADMIN"]);
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) throw new Error("VALIDATION:差し戻し理由は3文字以上で入力してください");
    const { id } = await context.params;
    const before = await db.report.findFirst({ where: { id, deletedAt: null }, include: { author: true } });
    if (!before) return NextResponse.json({ error: "報告が見つかりません" }, { status: 404 });
    const approved = parsed.data.action === "approve";
    const rejectionReason = parsed.data.action === "reject" ? parsed.data.reason : null;
    const report = await db.report.update({ where: { id }, data: { approvalStatus: approved ? "APPROVED" : "REJECTED", approvedById: approved ? user.id : null, approvedAt: approved ? new Date() : null, rejectionReason } });
    await db.notification.create({ data: { userId: before.authorId, title: approved ? "報告が承認されました" : "報告が差し戻されました", body: approved ? before.comment.slice(0, 60) : rejectionReason!, href: "/dashboard?tab=reports" } });
    await audit(user.id, approved ? "APPROVE_REPORT" : "REJECT_REPORT", "Report", id, { approvalStatus: before.approvalStatus }, { approvalStatus: report.approvalStatus, rejectionReason: report.rejectionReason });
    return NextResponse.json({ ok: true });
  } catch (error) { return apiError(error); }
}
