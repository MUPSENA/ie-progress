import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { dashboardPath } from "@/lib/roles";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "WORKER") redirect(dashboardPath(user.role));
  return <DashboardShell data={await getDashboardData(user)} />;
}
