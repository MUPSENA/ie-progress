import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/dashboard";
import { DashboardShell } from "@/components/DashboardShell";

export default async function DashboardPage() { const user = await getCurrentUser(); if (!user) redirect("/login"); return <DashboardShell data={await getDashboardData(user)} />; }
