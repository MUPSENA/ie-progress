"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CalendarClock, Camera, Check, CheckCircle2, ChevronDown, Clock3, Loader2, MessageSquare, RotateCcw, Send, UserRound } from "lucide-react";
import type { DashboardData, Report, Task } from "@/types/dashboard";
import { apiFetch, formatDate, isOverdue, statusLabel } from "@/lib/client-utils";

export function PageHeader({ eyebrow, title, text, actions }: { eyebrow?: string; title: string; text?: string; actions?: React.ReactNode }) { return <header className="page-header"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{text && <p>{text}</p>}</div>{actions && <div className="page-actions">{actions}</div>}</header>; }
export function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "orange" | "blue" }) { return <div className="progress-wrap" aria-label={`進捗${value}%`}><div className="progress-track"><span className={tone} style={{ width: `${value}%` }} /></div><strong>{value}%</strong></div>; }
export function StatusBadge({ status }: { status: string }) { const tone = ["DELAYED", "REJECTED", "RETURNED"].includes(status) ? "danger" : ["PENDING", "QUESTIONING", "UNCHECKED", "WAITING"].includes(status) ? "warning" : ["APPROVED", "DONE", "COMPLETED", "RESOLVED"].includes(status) ? "success" : "info"; return <span className={`status ${tone}`}><i />{statusLabel[status] || status}</span>; }
export function Metric({ label, value, note, icon: Icon, tone = "neutral" }: { label: string; value: string | number; note?: string; icon: typeof Camera; tone?: string }) { return <article className={`metric ${tone}`}><span className="metric-icon"><Icon size={21} /></span><div><p>{label}</p><strong>{value}</strong>{note && <small>{note}</small>}</div></article>; }

export function ReportCard({ report, admin = false, selected, onSelect }: { report: Report; admin?: boolean; selected?: boolean; onSelect?: (value: boolean) => void }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function action(kind: "approve" | "reject") { const reason = kind === "reject" ? window.prompt("差し戻し理由を入力してください（現場担当者へ通知されます）") : undefined; if (kind === "reject" && !reason) return; setBusy(true); setError(""); try { await apiFetch(`/api/reports/${report.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: kind, reason }) }); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "更新できませんでした"); } finally { setBusy(false); } }
  return <article className={`report-card ${selected ? "selected" : ""}`}>
    {admin && report.approvalStatus === "PENDING" && <label className="select-report"><input type="checkbox" checked={selected} onChange={(e) => onSelect?.(e.target.checked)} /><span className="sr-only">この報告を選択</span></label>}
    <div className="report-photo">{report.photos[0] ? <img src={`/api/photos/${report.photos[0].id}`} alt={`${report.scheduleItem.title}の現場写真`} /> : <span><Camera size={28} />写真なし</span>}<div className="photo-progress">{report.progress}%</div></div>
    <div className="report-content"><div className="report-meta"><StatusBadge status={report.approvalStatus} /><span>{formatDate(report.capturedAt, true)}</span></div><h3>{report.scheduleItem.title}</h3><p>{report.comment}</p><div className="byline"><span className="avatar tiny">{report.author.name.slice(0, 1)}</span>{report.author.name}<span>・</span>{report.author.trade || "担当者"}</div>{report.rejectionReason && <div className="alert error compact"><RotateCcw size={15} />差し戻し：{report.rejectionReason}</div>}{error && <div className="alert error compact">{error}</div>}{admin && report.approvalStatus === "PENDING" && <div className="card-actions"><button className="button text danger-text" onClick={() => action("reject")} disabled={busy}><RotateCcw size={16} />差し戻し</button><button className="button primary small" onClick={() => action("approve")} disabled={busy}>{busy ? <Loader2 className="spin" size={16} /> : <Check size={16} />}承認</button></div>}</div>
  </article>;
}

export function TaskCard({ task, user, workers = [] }: { task: Task; user: DashboardData["user"]; workers?: DashboardData["workers"] }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [body, setBody] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  const overdue = isOverdue(task.dueAt) && !["RESOLVED", "COMPLETED"].includes(task.status);
  async function update(payload: object) { setBusy(true); setError(""); try { await apiFetch(`/api/tasks/${task.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "更新できませんでした"); } finally { setBusy(false); } }
  async function reply(event: React.FormEvent) { event.preventDefault(); if (!body.trim()) return; setBusy(true); setError(""); try { await apiFetch(`/api/tasks/${task.id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) }); setBody(""); router.refresh(); } catch (err) { setError(err instanceof Error ? err.message : "返信できませんでした"); } finally { setBusy(false); } }
  const statuses = task.type === "OWNER_QUESTION" ? [["QUESTIONING", "質問中"], ["ANSWERED", "回答済み"], ["RESOLVED", "解決済み"]] : [["UNCHECKED", "未確認"], ["IN_PROGRESS", "対応中"], ["WAITING", "回答待ち"], ["COMPLETED", "完了"], ["RETURNED", "差し戻し"]];
  return <article className={`task-card ${overdue || task.priority === "URGENT" ? "priority" : ""}`}>
    <button className="task-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className={`task-type ${task.type === "OWNER_QUESTION" ? "question" : "request"}`}>{task.type === "OWNER_QUESTION" ? <MessageSquare size={16} /> : <AlertTriangle size={16} />}{task.type === "OWNER_QUESTION" ? "施主質問" : "現場依頼"}</span>
      <div className="task-main"><div className="task-title-row"><h3>{task.title}</h3>{task.priority === "URGENT" && <span className="urgent">緊急</span>}</div><p>{task.content}</p><div className="task-meta"><span><UserRound size={14} />{task.creator.name}</span><span><CalendarClock size={14} />{task.dueAt ? `${formatDate(task.dueAt)}まで` : "期限なし"}</span>{overdue && <strong>期限超過</strong>}</div></div>
      <div className="task-side"><StatusBadge status={task.status} /><ChevronDown className={open ? "rotate" : ""} /></div>
    </button>
    {open && <div className="task-detail">
      <div className="conversation">{task.messages.map((message) => <div key={message.id} className={`message ${message.author.role === "ADMIN" ? "admin" : ""}`}><div><strong>{message.author.name}</strong><time>{formatDate(message.createdAt, true)}</time></div><p>{message.body}</p></div>)}</div>
      <form onSubmit={reply} className="reply-form"><label className="sr-only" htmlFor={`reply-${task.id}`}>返信内容</label><textarea id={`reply-${task.id}`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="返信を入力…" rows={2} /><button className="icon-button primary-icon" disabled={busy || !body.trim()} aria-label="返信を送信"><Send size={18} /></button></form>
      <div className="task-controls">
        {user.role === "ADMIN" && <label>担当者<select value={task.assignedTo?.id || ""} onChange={(e) => update({ assignedToId: e.target.value || null })} disabled={busy}><option value="">未割当</option>{workers.map((worker) => <option value={worker.id} key={worker.id}>{worker.name}{worker.trade ? `（${worker.trade}）` : ""}</option>)}</select></label>}
        {user.role !== "OWNER" ? <label>状態<select value={task.status} onChange={(e) => update({ status: e.target.value })} disabled={busy}>{statuses.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label> : task.status === "ANSWERED" && <button className="button primary small" onClick={() => update({ status: "RESOLVED" })} disabled={busy}><CheckCircle2 size={16} />解決済みにする</button>}
      </div>{error && <div className="alert error compact">{error}</div>}
    </div>}
  </article>;
}

export function DueLabel({ date }: { date: string | null }) { if (!date) return null; const overdue = isOverdue(date); return <span className={overdue ? "due overdue" : "due"}><Clock3 size={14} />{overdue ? "期限超過" : formatDate(date)}</span>; }
