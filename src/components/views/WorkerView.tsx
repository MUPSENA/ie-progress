"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Camera, CheckCircle2, Clock3, FileClock, HardHat, ImageIcon, Loader2, MapPin, RefreshCw, Send, Trash2 } from "lucide-react";
import type { DashboardData, OfflineDraft, Project } from "@/types/dashboard";
import { apiFetch, dataUrlToBlob, formatDate } from "@/lib/client-utils";
import { readDrafts, writeDrafts } from "@/components/forms/ActionForms";
import { EmptyState } from "@/components/DashboardShell";
import { PageHeader, ProgressBar, ReportCard, StatusBadge, TaskCard } from "@/components/ui/Common";

type OpenModal = (value: { type: "report" | "request"; scheduleId?: string }) => void;

async function transmitDraft(draft: OfflineDraft) {
  const form = new FormData(); form.set("projectId", draft.projectId); form.set("scheduleItemId", draft.scheduleItemId); form.set("comment", draft.comment); form.set("progress", String(draft.progress)); form.set("capturedAt", draft.capturedAt); form.set("photo", new File([dataUrlToBlob(draft.dataUrl)], draft.fileName, { type: draft.mimeType }));
  await apiFetch("/api/reports", { method: "POST", body: form });
}

export function WorkerView({ data, project, tab, onOpen, onToast }: { data: DashboardData; project: Project; tab: string; onOpen: OpenModal; onToast: (value: string) => void }) {
  const router = useRouter(); const [drafts, setDrafts] = useState<OfflineDraft[]>(() => typeof window === "undefined" ? [] : readDrafts()); const [retrying, setRetrying] = useState("");
  const syncDrafts = useCallback(async () => {
    const pending = readDrafts(); if (!pending.length || !navigator.onLine) return;
    let sent = 0; const failed: OfflineDraft[] = [];
    for (const draft of pending) { try { await transmitDraft(draft); sent++; } catch { failed.push(draft); } }
    if (sent) { writeDrafts(failed); setDrafts(failed); onToast(`${sent}件の下書きを再送しました`); router.refresh(); }
  }, [onToast, router]);
  useEffect(() => { const update = () => setDrafts(readDrafts()); window.addEventListener("drafts-updated", update); window.addEventListener("online", syncDrafts); const timer = navigator.onLine ? window.setTimeout(syncDrafts, 0) : undefined; return () => { if (timer) window.clearTimeout(timer); window.removeEventListener("drafts-updated", update); window.removeEventListener("online", syncDrafts); }; }, [syncDrafts]);
  const days = useMemo(() => project.schedules.filter((item) => item.level === "DAY" && (!item.trade || item.trade === data.user.trade)), [project.schedules, data.user.trade]);
  const todayKey = new Date().toLocaleDateString("sv-SE");
  const today = days.filter((item) => item.currentStart.slice(0, 10) <= todayKey && item.currentEnd.slice(0, 10) >= todayKey);
  const shownToday = today.length ? today : days.filter((item) => item.status !== "DONE").slice(0, 3);
  const reports = data.reports.filter((item) => item.projectId === project.id && item.author.name === data.user.name);
  const tasks = data.tasks.filter((item) => item.projectId === project.id && item.type === "SITE_REQUEST");
  async function retry(draft: OfflineDraft) { setRetrying(draft.id); try { await transmitDraft(draft); const next = readDrafts().filter((item) => item.id !== draft.id); writeDrafts(next); setDrafts(next); onToast("下書きを送信しました"); router.refresh(); } catch (err) { onToast(err instanceof Error ? err.message : "再送できませんでした"); } finally { setRetrying(""); } }
  function removeDraft(id: string) { if (!window.confirm("この下書きを端末から削除しますか？")) return; const next = drafts.filter((item) => item.id !== id); writeDrafts(next); setDrafts(next); }

  if (tab === "reports") return <><PageHeader eyebrow="REPORTS" title="進捗報告" text="送信済みの報告と承認状況を確認できます。" actions={<button className="button primary" onClick={() => onOpen({ type: "report" })}><Camera size={18} />写真を追加</button>} /><div className="report-grid">{reports.map((report) => <ReportCard key={report.id} report={report} />)}</div>{!reports.length && <EmptyState icon={Camera} title="報告はまだありません" text="作業後に写真と進捗を登録しましょう。" />}</>;
  if (tab === "tasks") return <><PageHeader eyebrow="REQUESTS" title="元請けへの依頼" text="確認事項や判断が必要なことを、通常コメントと分けて管理します。" actions={<button className="button primary" onClick={() => onOpen({ type: "request" })}><Send size={18} />新しい依頼</button>} /><div className="task-list">{tasks.map((task) => <TaskCard key={task.id} task={task} user={data.user} />)}</div>{!tasks.length && <EmptyState icon={Send} title="依頼はありません" text="元請けの判断が必要なときに依頼を登録できます。" />}</>;
  if (tab === "drafts") return <><PageHeader eyebrow="OFFLINE" title="下書き・再送待ち" text="通信できないときの報告は、この端末にだけ安全に保管されます。" actions={drafts.length ? <button className="button secondary" onClick={syncDrafts}><RefreshCw size={17} />すべて再送</button> : undefined} /><div className="draft-list">{drafts.map((draft) => <article className="draft-card" key={draft.id}><img src={draft.dataUrl} alt="下書き写真" /><div><span className="status warning"><i />再送待ち</span><h3>{project.schedules.find((s) => s.id === draft.scheduleItemId)?.title || "工程"}</h3><p>{draft.comment}</p><small>{formatDate(draft.savedAt, true)}に端末保存 ・ {draft.progress}%</small></div><div className="draft-actions"><button className="button secondary small" onClick={() => removeDraft(draft.id)}><Trash2 size={16} />削除</button><button className="button primary small" onClick={() => retry(draft)} disabled={retrying === draft.id}>{retrying === draft.id ? <Loader2 className="spin" size={16} /> : <RefreshCw size={16} />}再送</button></div></article>)}</div>{!drafts.length && <EmptyState icon={FileClock} title="再送待ちはありません" text="通信が不安定な場合、報告はここへ自動保存されます。" />}</>;

  return <>
    <PageHeader eyebrow="TODAY" title={`${data.user.name.split(" ")[0]}さん、おはようございます`} text={`${new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(new Date())}の作業です。`} actions={<button className="button primary" onClick={() => onOpen({ type: "report" })}><Camera size={18} />写真を追加</button>} />
    <div className="site-strip"><div><MapPin size={18} /><span><small>今日の現場</small><strong>{project.name}</strong><small>{project.address}</small></span></div><span className="trade-chip"><HardHat size={16} />{data.user.trade || "現場担当"}</span></div>
    <section className="section-block"><div className="section-heading"><div><p className="eyebrow">TODAY&apos;S WORK</p><h2>今日やること</h2></div><span>{shownToday.length}件</span></div>
      <div className="today-list">{shownToday.map((item, index) => <article className={`today-card ${item.status === "DELAYED" ? "delayed" : ""}`} key={item.id}><div className="sequence">{String(index + 1).padStart(2, "0")}</div><div className="today-main"><div className="today-top"><StatusBadge status={item.status} /><span><Clock3 size={14} />{formatDate(item.currentStart)}{item.currentStart.slice(0, 10) !== item.currentEnd.slice(0, 10) && `〜${formatDate(item.currentEnd)}`}</span></div><h3>{item.title}</h3><p>{item.description}</p><ProgressBar value={item.progress} tone={item.status === "DELAYED" ? "orange" : "green"} /></div><button className="button secondary" onClick={() => onOpen({ type: "report", scheduleId: item.id })}><Camera size={17} />進捗を更新</button></article>)}</div>
      {!shownToday.length && <EmptyState icon={CheckCircle2} title="今日の担当工程はありません" text="工程が割り当てられると、ここに表示されます。" />}
    </section>
    <div className="two-columns"><section className="section-block"><div className="section-heading"><div><p className="eyebrow">LATEST</p><h2>最近の報告</h2></div></div>{reports.slice(0, 2).map((report) => <div className="mini-report" key={report.id}>{report.photos[0] ? <img src={`/api/photos/${report.photos[0].id}`} alt="現場写真" /> : <span className="mini-placeholder"><ImageIcon /></span>}<div><StatusBadge status={report.approvalStatus} /><h3>{report.scheduleItem.title}</h3><p>{report.comment}</p></div></div>)}</section>
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">REQUEST</p><h2>元請けへの依頼</h2></div><button className="button text" onClick={() => onOpen({ type: "request" })}>新規依頼</button></div>{tasks.slice(0, 3).map((task) => <div className="mini-task" key={task.id}><span className={task.priority === "URGENT" ? "urgent-dot" : "normal-dot"} /><div><h3>{task.title}</h3><p>{task.dueAt ? `${formatDate(task.dueAt)}まで` : "期限なし"}</p></div><StatusBadge status={task.status} /></div>)}{!tasks.length && <p className="muted compact-copy"><AlertCircle size={16} />現在の依頼はありません</p>}</section></div>
  </>;
}
