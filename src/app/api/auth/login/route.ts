import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { apiError } from "@/lib/http";
import { audit } from "@/lib/audit";

const schema = z.object({ email: z.string().email(), password: z.string().min(8).max(100) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "メールアドレスとパスワードを確認してください" }, { status: 400 });
    const user = await db.user.findFirst({ where: { email: parsed.data.email.toLowerCase(), active: true, deletedAt: null } });
    if (!user || !(await compare(parsed.data.password, user.passwordHash))) {
      return NextResponse.json({ error: "メールアドレスまたはパスワードが違います" }, { status: 401 });
    }
    await createSession({ id: user.id, name: user.name, email: user.email, role: user.role, trade: user.trade });
    await audit(user.id, "LOGIN", "User", user.id, undefined, undefined, request.headers.get("x-forwarded-for"));
    return NextResponse.json({ ok: true, role: user.role });
  } catch (error) { return apiError(error); }
}
