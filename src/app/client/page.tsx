import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/DashboardShell";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { dashboardPath } from "@/lib/roles";

export const metadata: Metadata = { title: "Our Home" };

export default async function ClientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "OWNER") redirect(dashboardPath(user.role));
  return <DashboardShell data={await getDashboardData(user)} />;
}
