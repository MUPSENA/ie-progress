import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/SignupForm";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "招待アカウント登録", description: "Auri+の招待アカウントを登録します。" };

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  return <SignupForm />;
}
