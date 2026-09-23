import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth";

export async function getDashboardData(user: SessionUser) {
  const projectWhere = user.role === "ADMIN"
    ? { deletedAt: null }
    : user.role === "OWNER"
      ? { ownerId: user.id, deletedAt: null }
      : { members: { some: { userId: user.id } }, deletedAt: null };

  const projects = await db.project.findMany({
    where: projectWhere,
    orderBy: { code: "desc" },
    include: {
      owner: { select: { name: true } },
      members: { include: { user: { select: { id: true, name: true, trade: true, role: true } } } },
      schedules: { where: { deletedAt: null }, orderBy: [{ sortOrder: "asc" }, { currentStart: "asc" }] },
    },
  });
  const projectIds = projects.map((p) => p.id);
  const reports = await db.report.findMany({
    where: {
      projectId: { in: projectIds },
      deletedAt: null,
      ...(user.role === "OWNER" ? { approvalStatus: "APPROVED" as const } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, trade: true } },
      scheduleItem: { select: { title: true } },
      project: { select: { name: true } },
      photos: { where: { deletedAt: null }, select: { id: true, mimeType: true } },
    },
    take: 80,
  });
  const tasks = await db.task.findMany({
    where: {
      projectId: { in: projectIds },
      deletedAt: null,
      ...(user.role === "OWNER" ? { type: "OWNER_QUESTION" as const, creatorId: user.id } : {}),
      ...(user.role === "WORKER" ? { OR: [{ creatorId: user.id }, { assignedToId: user.id }] } : {}),
    },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    include: {
      creator: { select: { name: true, trade: true } },
      assignedTo: { select: { id: true, name: true, trade: true } },
      project: { select: { name: true } },
      scheduleItem: { select: { title: true } },
      targetReport: { select: { id: true, comment: true } },
      messages: { where: { deletedAt: null }, orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, role: true } } } },
    },
  });
  const changes = user.role === "ADMIN" ? await db.scheduleChange.findMany({
    where: { projectId: { in: projectIds } }, orderBy: { createdAt: "desc" }, take: 30,
    include: { project: { select: { name: true } }, scheduleItem: { select: { title: true } }, changedBy: { select: { name: true } } },
  }) : [];
  const auditLogs = user.role === "ADMIN" ? await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30, include: { user: { select: { name: true } } } }) : [];
  const workers = user.role === "ADMIN" ? await db.user.findMany({ where: { role: { in: ["ADMIN", "WORKER"] }, active: true, deletedAt: null }, select: { id: true, name: true, trade: true, role: true } }) : [];

  return JSON.parse(JSON.stringify({ user, projects, reports, tasks, changes, auditLogs, workers }));
}
