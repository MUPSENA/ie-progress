import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";

export async function POST(request: Request) {
  try {
    const user = await requireUser(["ADMIN"]);
    const parsed = z.object({ ids: z.array(z.string()).min(1).max(100) }).safeParse(await request.json());
    if (!parsed.success) throw new Error("VALIDATION:承認する報告を選択してください");
    const pending = await db.report.findMany({ where: { id: { in: parsed.data.ids }, approvalStatus: "PENDING", deletedAt: null }, select: { id: true, authorId: true } });
    await db.report.updateMany({ where: { id: { in: pending.map((r) => r.id) } }, data: { approvalStatus: "APPROVED", approvedById: user.id, approvedAt: new Date(), rejectionReason: null } });
    if (pending.length) await db.notification.createMany({ data: pending.map((r) => ({ userId: r.authorId, title: "報告が承認されました", body: "元請けが現場報告を承認しました", href: "/dashboard?tab=reports" })) });
    await Promise.all(pending.map((r) => audit(user.id, "APPROVE_REPORT", "Report", r.id, { approvalStatus: "PENDING" }, { approvalStatus: "APPROVED" })));
    return NextResponse.json({ ok: true, count: pending.length });
  } catch (error) { return apiError(error); }
}
