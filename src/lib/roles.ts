import type { Role } from "@prisma/client";

export function dashboardPath(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "WORKER") return "/staff";
  return "/client";
}

export const publicRoleName: Record<Role, "ADMIN" | "STAFF" | "CLIENT"> = {
  ADMIN: "ADMIN",
  WORKER: "STAFF",
  OWNER: "CLIENT",
};
