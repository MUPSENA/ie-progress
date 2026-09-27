import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "ログイン",
  description: "Auri+へログインします。",
};

export default async function LoginPage() { if (await getCurrentUser()) redirect("/dashboard"); return <LoginForm />; }
