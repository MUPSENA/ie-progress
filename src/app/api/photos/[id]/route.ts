import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { canViewPhoto } from "@/lib/access";
import { apiError } from "@/lib/http";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const photo = await canViewPhoto(user, id);
    if (!photo) return NextResponse.json({ error: "写真が見つかりません" }, { status: 404 });
    const safeName = path.basename(photo.storageKey);
    const data = await readFile(path.join(process.cwd(), "data", "uploads", safeName));
    return new NextResponse(data, { headers: { "Content-Type": photo.mimeType, "Cache-Control": "private, max-age=300", "X-Content-Type-Options": "nosniff" } });
  } catch (error) { return apiError(error); }
}
