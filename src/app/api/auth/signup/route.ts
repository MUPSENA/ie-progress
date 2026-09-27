import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { apiError } from "@/lib/http";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(10).max(100).regex(/[A-Za-z]/).regex(/\d/),
});

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "入力内容を確認してください。パスワードは英字と数字を含む10文字以上で設定してください。" }, { status: 400 });
    }

    const { name, email, password } = parsed.data;
    const existingUser = await db.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) return NextResponse.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });

    const passwordHash = await hash(password, 12);
    const user = await db.$transaction(async (transaction) => {
      const created = await transaction.user.create({
        data: { name, email, passwordHash, role: "OWNER" },
        select: { id: true, name: true, email: true, role: true, trade: true },
      });
      await transaction.auditLog.create({
        data: {
          userId: created.id,
          action: "ACCOUNT_CREATED",
          entityType: "User",
          entityId: created.id,
          afterJson: JSON.stringify({ role: created.role }),
          ipAddress: request.headers.get("x-forwarded-for"),
        },
      });
      return created;
    });

    await createSession(user);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });
    }
    return apiError(error);
  }
}
