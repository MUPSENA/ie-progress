import { PrismaClient, Role, ScheduleLevel, ScheduleStatus, ApprovalStatus, TaskType, TaskStatus, Priority } from "@prisma/client";
import { hash } from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient();
const d = (value: string) => new Date(`${value}T09:00:00+09:00`);

async function main() {
  await db.auditLog.deleteMany();
  await db.notification.deleteMany();
  await db.taskMessage.deleteMany();
  await db.photo.deleteMany();
  await db.task.deleteMany();
  await db.report.deleteMany();
  await db.scheduleChange.deleteMany();
  await db.scheduleItem.deleteMany();
  await db.projectMember.deleteMany();
  await db.project.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await hash("demo1234", 12);
  const [admin, worker, electrician, owner, owner2] = await Promise.all([
    db.user.create({ data: { email: "admin@example.jp", passwordHash, name: "山田 管理", role: Role.ADMIN } }),
    db.user.create({ data: { email: "worker@example.jp", passwordHash, name: "佐藤 健", role: Role.WORKER, trade: "大工" } }),
    db.user.create({ data: { email: "electric@example.jp", passwordHash, name: "鈴木 電工", role: Role.WORKER, trade: "電気" } }),
    db.user.create({ data: { email: "owner@example.jp", passwordHash, name: "田中 ご夫妻", role: Role.OWNER } }),
    db.user.create({ data: { email: "owner2@example.jp", passwordHash, name: "中村 様", role: Role.OWNER } }),
  ]);

  const project = await db.project.create({
    data: {
      code: "TK-2026-014",
      name: "田中様邸 新築工事",
      address: "東京都世田谷区桜丘 2丁目",
      ownerId: owner.id,
      startDate: d("2026-08-03"),
      plannedEndDate: d("2027-01-29"),
      members: { create: [{ userId: worker.id }, { userId: electrician.id }, { userId: admin.id }] },
    },
  });
  const otherProject = await db.project.create({
    data: {
      code: "KN-2026-021",
      name: "中村様邸 改修工事",
      address: "神奈川県川崎市中原区",
      ownerId: owner2.id,
      startDate: d("2026-09-01"),
      plannedEndDate: d("2026-12-18"),
      members: { create: [{ userId: admin.id }] },
    },
  });

  await db.scheduleItem.create({ data: { projectId: project.id, level: ScheduleLevel.MONTH, title: "8月｜着工・基礎", originalStart: d("2026-08-03"), originalEnd: d("2026-08-31"), currentStart: d("2026-08-03"), currentEnd: d("2026-08-31"), progress: 100, status: ScheduleStatus.DONE, sortOrder: 1 } });
  const september = await db.scheduleItem.create({ data: { projectId: project.id, level: ScheduleLevel.MONTH, title: "9月｜上棟・屋根・外壁", originalStart: d("2026-09-01"), originalEnd: d("2026-09-30"), currentStart: d("2026-09-01"), currentEnd: d("2026-10-03"), progress: 52, status: ScheduleStatus.DELAYED, sortOrder: 2 } });
  const week = await db.scheduleItem.create({ data: { projectId: project.id, parentId: september.id, level: ScheduleLevel.WEEK, title: "9/21週｜屋根・外壁下地", originalStart: d("2026-09-21"), originalEnd: d("2026-09-26"), currentStart: d("2026-09-21"), currentEnd: d("2026-09-28"), progress: 52, status: ScheduleStatus.DELAYED, sortOrder: 1 } });
  const roof = await db.scheduleItem.create({ data: { projectId: project.id, parentId: week.id, level: ScheduleLevel.DAY, title: "屋根ルーフィング施工", description: "雨仕舞いを確認しながら防水シートを施工", trade: "大工", originalStart: d("2026-09-23"), originalEnd: d("2026-09-23"), currentStart: d("2026-09-23"), currentEnd: d("2026-09-23"), progress: 65, status: ScheduleStatus.IN_PROGRESS, sortOrder: 1 } });
  const wiring = await db.scheduleItem.create({ data: { projectId: project.id, parentId: week.id, level: ScheduleLevel.DAY, title: "電気配線の先行確認", description: "コンセント・照明位置を図面と照合", trade: "電気", originalStart: d("2026-09-24"), originalEnd: d("2026-09-24"), currentStart: d("2026-09-24"), currentEnd: d("2026-09-25"), progress: 20, status: ScheduleStatus.DELAYED, sortOrder: 2 } });
  await db.scheduleItem.create({ data: { projectId: project.id, parentId: week.id, level: ScheduleLevel.DAY, title: "外壁下地・透湿防水シート", description: "重ね幅と開口部まわりを重点確認", trade: "大工", originalStart: d("2026-09-25"), originalEnd: d("2026-09-26"), currentStart: d("2026-09-26"), currentEnd: d("2026-09-28"), progress: 0, status: ScheduleStatus.NOT_STARTED, sortOrder: 3 } });
  await db.scheduleItem.create({ data: { projectId: project.id, level: ScheduleLevel.MONTH, title: "10月｜大工造作・設備", originalStart: d("2026-10-01"), originalEnd: d("2026-10-31"), currentStart: d("2026-10-04"), currentEnd: d("2026-11-04"), progress: 0, status: ScheduleStatus.NOT_STARTED, sortOrder: 3 } });
  await db.scheduleItem.create({ data: { projectId: otherProject.id, level: ScheduleLevel.MONTH, title: "9月｜解体・下地", originalStart: d("2026-09-01"), originalEnd: d("2026-09-30"), currentStart: d("2026-09-01"), currentEnd: d("2026-09-30"), progress: 72, status: ScheduleStatus.IN_PROGRESS, sortOrder: 1 } });

  await db.scheduleChange.create({ data: { projectId: project.id, scheduleItemId: week.id, changedById: admin.id, previousStart: d("2026-09-21"), previousEnd: d("2026-09-26"), newStart: d("2026-09-21"), newEnd: d("2026-09-28"), reason: "台風接近による屋根作業の安全確保", createdAt: d("2026-09-22") } });

  const approved = await db.report.create({ data: { projectId: project.id, scheduleItemId: roof.id, authorId: worker.id, comment: "屋根の防水シートを南面まで施工しました。雨仕舞いも確認済みです。", progress: 65, capturedAt: d("2026-09-22"), approvalStatus: ApprovalStatus.APPROVED, approvedById: admin.id, approvedAt: d("2026-09-22") } });
  await db.report.create({ data: { projectId: project.id, scheduleItemId: roof.id, authorId: worker.id, comment: "北面の立ち上がり部分を施工。端部の確認をお願いします。", progress: 78, capturedAt: d("2026-09-23"), approvalStatus: ApprovalStatus.PENDING } });
  await db.report.create({ data: { projectId: project.id, scheduleItemId: wiring.id, authorId: electrician.id, comment: "リビングのコンセント位置に図面との相違があり、確認待ちです。", progress: 20, capturedAt: d("2026-09-22"), approvalStatus: ApprovalStatus.REJECTED, rejectionReason: "相違箇所が分かる引きの写真を追加してください" } });

  const uploadDir = path.join(process.cwd(), "data", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const demoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="s" x2="0" y2="1"><stop stop-color="#b8d8e8"/><stop offset="1" stop-color="#eef4f0"/></linearGradient></defs><rect width="1200" height="800" fill="url(#s)"/><rect y="570" width="1200" height="230" fill="#9eb58d"/><path d="M190 580V310L575 115l390 195v270" fill="#d8c6a8" stroke="#5b493b" stroke-width="18"/><path d="m135 330 440-225 450 225" fill="none" stroke="#364452" stroke-width="42"/><g stroke="#735f4c" stroke-width="15"><path d="M305 580V350M455 580V270M700 580V265M850 580V350"/><path d="M205 430H950"/></g><rect x="508" y="395" width="150" height="185" fill="#7694a7"/><text x="60" y="740" font-family="sans-serif" font-size="34" fill="#33413a">田中様邸｜屋根防水施工 2026.09.22</text></svg>`;
  await writeFile(path.join(uploadDir, "demo-roof.svg"), demoSvg);
  await db.photo.create({ data: { reportId: approved.id, storageKey: "demo-roof.svg", mimeType: "image/svg+xml", byteSize: Buffer.byteLength(demoSvg), originalName: "屋根施工状況.svg", capturedAt: d("2026-09-22") } });

  const question = await db.task.create({ data: { type: TaskType.OWNER_QUESTION, projectId: project.id, targetReportId: approved.id, creatorId: owner.id, assignedToId: admin.id, title: "雨が降っても大丈夫ですか？", content: "防水シートの状態で雨予報ですが、室内への影響はありませんか？", priority: Priority.NORMAL, status: TaskStatus.QUESTIONING, dueAt: d("2026-09-24"), unreadForAdmin: true } });
  await db.taskMessage.create({ data: { taskId: question.id, authorId: owner.id, body: "防水シートの状態で雨予報ですが、室内への影響はありませんか？", createdAt: d("2026-09-22") } });
  const request = await db.task.create({ data: { type: TaskType.SITE_REQUEST, projectId: project.id, scheduleItemId: wiring.id, creatorId: electrician.id, assignedToId: admin.id, title: "リビング照明位置の確認", content: "梁との干渉があるため、ダウンライトを東へ150mm移動してよいか確認をお願いします。", trade: "電気", priority: Priority.URGENT, status: TaskStatus.UNCHECKED, dueAt: d("2026-09-23"), unreadForAdmin: true } });
  await db.taskMessage.create({ data: { taskId: request.id, authorId: electrician.id, body: request.content, createdAt: d("2026-09-22") } });

  await db.auditLog.create({ data: { userId: admin.id, action: "SEED_CREATED", entityType: "Project", entityId: project.id, afterJson: JSON.stringify({ code: project.code, name: project.name }) } });
  console.log("Seed complete. Login: admin@example.jp / worker@example.jp / owner@example.jp (password: demo1234)");
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => db.$disconnect());
