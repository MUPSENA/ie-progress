import { NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

export function apiError(error: unknown) {
  if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error && error.message === "PROJECT_FORBIDDEN") return NextResponse.json({ error: "この現場を閲覧する権限がありません" }, { status: 403 });
  if (error instanceof Error && error.message.startsWith("VALIDATION:")) return NextResponse.json({ error: error.message.slice(11) }, { status: 400 });
  console.error(error);
  return NextResponse.json({ error: "処理に失敗しました。時間をおいて再度お試しください。" }, { status: 500 });
}
