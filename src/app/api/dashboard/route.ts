import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { apiError } from "@/lib/http";

export async function GET() {
  try { const user = await requireUser(); return NextResponse.json(await getDashboardData(user)); }
  catch (error) { return apiError(error); }
}
