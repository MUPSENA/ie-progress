"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Building2, CalendarDays, Camera, CheckSquare, ClipboardList, FileClock, HelpCircle, History, Home, LayoutDashboard, LogOut, Menu, MessageCircleQuestion, Send, ShieldCheck, Wifi, WifiOff, X } from "lucide-react";
import type { DashboardData } from "@/types/dashboard";
import { apiFetch } from "@/lib/client-utils";
import { AdminView } from "@/components/views/AdminView";
import { WorkerView } from "@/components/views/WorkerView";
import { OwnerView } from "@/components/views/OwnerView";
import { QuestionForm, ReportForm, RequestForm } from "@/components/forms/ActionForms";

type Modal = null | { type: "report" | "request" | "question"; scheduleId?: string; reportId?: string };

const navByRole = {
  ADMIN: [
    { id: "overview", label: "全現場", icon: LayoutDashboard }, { id: "approvals", label: "承認待ち", icon: CheckSquare },
    { id: "tasks", label: "質問・依頼", icon: ClipboardList }, { id: "schedule", label: "工程・変更", icon: CalendarDays }, { id: "audit", label: "監査履歴", icon: History },
  ],
  WORKER: [
    { id: "today", label: "今日", icon: Home }, { id: "reports", label: "報告", icon: Camera },
    { id: "tasks", label: "依頼", icon: Send }, { id: "drafts", label: "下書き", icon: FileClock },
  ],
  OWNER: [
    { id: "home", label: "進捗", icon: Home }, { id: "photos", label: "写真", icon: Camera }, { id: "questions", label: "質問", icon: MessageCircleQuestion },
  ],
} as const;

export function DashboardShell({ data }: { data: DashboardData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nav = navByRole[data.user.role];
  const requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState<string>(nav.some((item) => item.id === requestedTab) ? requestedTab! : nav[0].id);
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [modal, setModal] = useState<Modal>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState("");
  const project = useMemo(() => data.projects.find((item) => item.id === projectId) ?? data.projects[0], [data.projects, projectId]);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine); update();
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 3500); return () => window.clearTimeout(timer); }, [toast]);

  function changeTab(id: string) { setTab(id); setMenuOpen(false); }
  function complete(message: string) { setModal(null); setToast(message); router.refresh(); }
  async function logout() { await apiFetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }
  const roleLabel = data.user.role === "ADMIN" ? "管理元請け" : data.user.role === "WORKER" ? data.user.trade || "現場担当" : "施主";

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand sidebar-brand"><span className="brand-mark"><Building2 size={21} /></span><span>いえ進捗</span><button className="icon-button close-menu" onClick={() => setMenuOpen(false)} aria-label="メニューを閉じる"><X /></button></div>
        <nav className="sidebar-nav" aria-label="メインメニュー">
          <p className="nav-caption">メニュー</p>
          {nav.map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => changeTab(item.id)}><item.icon size={19} /><span>{item.label}</span>{item.id === "approvals" && data.reports.filter((r) => r.approvalStatus === "PENDING").length > 0 && <b>{data.reports.filter((r) => r.approvalStatus === "PENDING").length}</b>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="user-chip"><span className="avatar">{data.user.name.slice(0, 1)}</span><span><strong>{data.user.name}</strong><small>{roleLabel}</small></span></div>
          <button className="logout" onClick={logout}><LogOut size={18} />ログアウト</button>
        </div>
      </aside>
      {menuOpen && <button className="menu-scrim" onClick={() => setMenuOpen(false)} aria-label="メニューを閉じる" />}

      <div className="app-main">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setMenuOpen(true)} aria-label="メニューを開く"><Menu /></button>
          <div className="project-picker"><span>{data.user.role === "OWNER" ? "わが家" : "表示中の現場"}</span><select value={project?.id ?? ""} onChange={(e) => setProjectId(e.target.value)} aria-label="現場を選択">{data.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          <div className={`connection ${online ? "online" : "offline"}`}>{online ? <Wifi size={15} /> : <WifiOff size={15} />}<span>{online ? "オンライン" : "オフライン"}</span></div>
          <button className="icon-button" aria-label="通知"><Bell size={20} /><span className="notification-dot" /></button>
          <div className="top-user"><span className="avatar small">{data.user.name.slice(0, 1)}</span><span><strong>{data.user.name}</strong><small>{roleLabel}</small></span></div>
        </header>

        <main className="content">
          {!project ? <EmptyState icon={Building2} title="表示できる現場がありません" text="管理者へ現場への参加を依頼してください。" /> : data.user.role === "ADMIN" ? <AdminView data={data} project={project} tab={tab} onTab={changeTab} /> : data.user.role === "WORKER" ? <WorkerView data={data} project={project} tab={tab} onOpen={setModal} onToast={setToast} /> : <OwnerView data={data} project={project} tab={tab} onOpen={setModal} />}
        </main>

        <nav className="mobile-nav" aria-label="モバイルメニュー">{nav.slice(0, 4).map((item) => <button key={item.id} className={tab === item.id ? "active" : ""} onClick={() => changeTab(item.id)}><item.icon size={20} /><span>{item.label}</span></button>)}</nav>
      </div>

      {data.user.role === "WORKER" && <button className="fab" onClick={() => setModal({ type: "report" })}><Camera size={20} />写真で報告</button>}
      {modal && <ModalFrame title={modal.type === "report" ? "写真で進捗を報告" : modal.type === "request" ? "元請けへ依頼" : "新しい質問"} onClose={() => setModal(null)}>{modal.type === "report" ? <ReportForm project={project} defaultScheduleId={modal.scheduleId} onComplete={() => complete("報告を送信しました。承認待ちです。") } onDraft={() => { setModal(null); setToast("端末に下書きを保存しました"); setTab("drafts"); }} /> : modal.type === "request" ? <RequestForm project={project} onComplete={() => complete("依頼を登録しました") } /> : <QuestionForm data={data} project={project} defaultReportId={modal.reportId} onComplete={() => complete("質問を送信しました") } />}</ModalFrame>}
      {toast && <div className="toast" role="status"><ShieldCheck size={18} />{toast}</div>}
    </div>
  );
}

export function ModalFrame({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><div><p className="eyebrow">NEW</p><h2 id="modal-title">{title}</h2></div><button className="icon-button" onClick={onClose} aria-label="閉じる"><X /></button></header>{children}</section></div>;
}

export function EmptyState({ icon: Icon = HelpCircle, title, text }: { icon?: typeof HelpCircle; title: string; text: string }) {
  return <div className="empty-state"><span><Icon size={25} /></span><h3>{title}</h3><p>{text}</p></div>;
}
