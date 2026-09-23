import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export async function canAccessProject(user: SessionUser, projectId: string) {
  if (user.role === "ADMIN") return true;
  const project = await db.project.findFirst({
    where: user.role === "OWNER"
      ? { id: projectId, ownerId: user.id, deletedAt: null }
      : { id: projectId, members: { some: { userId: user.id } }, deletedAt: null },
    select: { id: true },
  });
  return Boolean(project);
}

export async function assertProjectAccess(user: SessionUser, projectId: string) {
  if (!(await canAccessProject(user, projectId))) throw new Error("PROJECT_FORBIDDEN");
}

export async function canViewPhoto(user: SessionUser, photoId: string) {
  const photo = await db.photo.findFirst({
    where: { id: photoId, deletedAt: null },
    include: { report: { select: { projectId: true, approvalStatus: true } }, task: { select: { projectId: true } } },
  });
  if (!photo) return null;
  const projectId = photo.report?.projectId ?? photo.task?.projectId;
  if (!projectId || !(await canAccessProject(user, projectId))) return null;
  if (user.role === "OWNER" && (!photo.report || photo.report.approvalStatus !== "APPROVED")) return null;
  return photo;
}
