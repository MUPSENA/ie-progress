import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

const COOKIE_NAME = "ie_session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || (process.env.NODE_ENV === "production" && value.includes("local-development"))) {
    throw new Error("AUTH_SECRET を安全な値に設定してください");
  }
  return new TextEncoder().encode(value);
}

export type SessionUser = { id: string; name: string; email: string; role: Role; trade: string | null };

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ name: user.name, email: user.email, role: user.role, trade: user.trade })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 12 });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await db.user.findFirst({ where: { id: payload.sub, active: true, deletedAt: null }, select: { id: true, name: true, email: true, role: true, trade: true } });
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(roles?: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("ログインが必要です", 401);
  if (roles && !roles.includes(user.role)) throw new AuthError("この操作を行う権限がありません", 403);
  return user;
}

export class AuthError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
