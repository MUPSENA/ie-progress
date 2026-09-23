"use client";

import { CalendarDays, Camera, CheckCircle2, ChevronRight, Clock3, HelpCircle, Home, ImageIcon, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardData, Project } from "@/types/dashboard";
import { formatDate, formatFullDate } from "@/lib/client-utils";
import { EmptyState } from "@/components/DashboardShell";
import { PageHeader, ReportCard, StatusBadge, TaskCard } from "@/components/ui/Common";

type OpenModal = (value: { type: "question"; reportId?: string }) => void;
const friendly: Record<string, { title: string; description: string }> = {
  "着工": { title: "工事が始まりました", description: "安全に作業を始めるための準備をしています。" },
  "基礎": { title: "家を支える土台づくり", description: "建物を足元からしっかり支える部分をつくります。" },
  "上棟": { title: "家の骨組みができました", description: "柱や梁を組み、家のかたちが見えてきます。" },
  "屋根": { title: "雨から家を守る工事", description: "屋根と防水シートを施工して、雨の侵入を防ぎます。" },
  "外壁": { title: "外まわりを整えています", description: "雨や風から住まいを守る外側を仕上げます。" },
  "大工": { title: "お部屋のかたちをつくります", description: "壁や天井など、室内の下地を整えます。" },
  "電気": { title: "電気の通り道を準備します", description: "照明やコンセントにつながる配線を整えます。" },
};
function friendlySchedule(title: string) { const entry = Object.entries(friendly).find(([key]) => title.includes(key)); return entry?.[1] ?? { title, description: "一つずつ確認しながら丁寧に工事を進めています。" }; }

export function OwnerView({ data, project, tab, onOpen }: { data: DashboardData; project: Project; tab: string; onOpen: OpenModal }) {
  const router = useRouter();
  const reports = data.reports.filter((report) => report.projectId === project.id && report.approvalStatus === "APPROVED");
  const questions = data.tasks.filter((task) => task.projectId === project.id && task.type === "OWNER_QUESTION");
  const months = project.schedules.filter((item) => item.level === "MONTH");
  const overall = months.length ? Math.round(months.reduce((sum, item) => sum + item.progress, 0) / months.length) : 0;
  const active = project.schedules.find((item) => item.level === "DAY" && item.status === "IN_PROGRESS") || project.schedules.find((item) => item.status === "IN_PROGRESS");
  const next = project.schedules.find((item) => item.level === "DAY" && item.status === "NOT_STARTED");
  if (tab === "photos") return <><PageHeader eyebrow="PHOTO ALBUM" title="工事写真" text="元請けが確認・承認した写真だけを時系列で掲載しています。" /><div className="owner-timeline">{reports.map((report, index) => <div className="timeline-item" key={report.id}><div className="timeline-date"><strong>{new Date(report.capturedAt).getDate()}</strong><span>{new Intl.DateTimeFormat("ja-JP", { month: "short" }).format(new Date(report.capturedAt))}</span></div><div className="timeline-line"><i /></div><div className="timeline-report"><ReportCard report={report} /><button className="button secondary small ask-photo" onClick={() => onOpen({ type: "question", reportId: report.id })}><MessageCircleQuestion size={16} />この報告について質問</button></div>{index === reports.length - 1 && <span className="timeline-end" />}</div>)}</div>{!reports.length && <EmptyState icon={ImageIcon} title="公開中の写真はありません" text="確認済みの写真が届くまで、もう少しお待ちください。" />}</>;
  if (tab === "questions") return <><PageHeader eyebrow="QUESTIONS" title="質問一覧" text="回答が届いた質問は、ご自身で解決済みにできます。" actions={<button className="button primary" onClick={() => onOpen({ type: "question" })}><MessageCircleQuestion size={18} />新しい質問</button>} /><div className="task-list owner-tasks">{questions.map((task) => <TaskCard key={task.id} task={task} user={data.user} />)}</div>{!questions.length && <EmptyState icon={HelpCircle} title="質問はありません" text="工事写真や進み具合について、いつでも質問できます。" />}</>;
  const friendlyActive = friendlySchedule(active?.title || "準備中"); const friendlyNext = friendlySchedule(next?.title || "次の工程を調整中");
  return <>
    <PageHeader eyebrow="MY HOME" title={`${project.owner.name}の家づくり`} text={`${formatFullDate(new Date().toISOString())} 現在｜${project.address}`} actions={<span className="owner-safe"><CheckCircle2 size={17} />掲載内容は確認済みです</span>} />
    <section className="owner-hero"><div className="owner-hero-copy"><p className="eyebrow light">CONSTRUCTION PROGRESS</p><h2>おうちの完成まで<br /><em>{overall}%</em> 進みました</h2><p>現在は「{friendlyActive.title}」の段階です。<br />安全を第一に、ていねいに工事を進めています。</p><div className="owner-progress"><span style={{ width: `${overall}%` }} /><i style={{ left: `${overall}%` }}><Home size={16} /></i></div><div className="owner-milestones"><span>工事開始</span><span>完成・お引き渡し</span></div></div><div className="owner-hero-art"><div className="house-shape"><Home size={86} /><Sparkles className="spark one" /><Sparkles className="spark two" /></div><span>{project.code}</span></div></section>
    <div className="owner-next-grid"><article className="now-card"><span className="step-icon current"><Clock3 /></span><div><p className="eyebrow">いま、ここです</p><h2>{friendlyActive.title}</h2><p>{friendlyActive.description}</p>{active && <div className="plain-progress"><span><i style={{ width: `${active.progress}%` }} /></span><strong>{active.progress}%</strong></div>}</div></article><article className="now-card"><span className="step-icon next"><ChevronRight /></span><div><p className="eyebrow">つぎにすること</p><h2>{friendlyNext.title}</h2><p>{friendlyNext.description}</p>{next && <small><CalendarDays size={15} />{formatDate(next.currentStart)}ごろから</small>}</div></article></div>
    <section className="section-block owner-latest"><div className="section-heading"><div><p className="eyebrow">LATEST UPDATE</p><h2>最近届いた工事のようす</h2></div><span>{reports.length}件の報告</span></div>{reports[0] ? <div className="featured-report"><div className="featured-photo">{reports[0].photos[0] ? <img src={`/api/photos/${reports[0].photos[0].id}`} alt="最近の工事写真" /> : <div className="photo-fallback"><Camera size={30} />写真はありません</div>}<span><Camera size={16} />{formatDate(reports[0].capturedAt)}</span></div><div className="featured-copy"><StatusBadge status="APPROVED" /><p className="eyebrow">{reports[0].scheduleItem.title}</p><h3>{friendlySchedule(reports[0].scheduleItem.title).title}</h3><p>{reports[0].comment}</p><div className="featured-actions"><button className="button secondary" onClick={() => onOpen({ type: "question", reportId: reports[0].id })}><MessageCircleQuestion size={17} />この報告について質問</button></div></div></div> : <EmptyState icon={Camera} title="写真を確認中です" text="元請けの確認が済んだ写真から順に公開されます。" />}</section>
    {questions.filter((q) => q.status === "ANSWERED").length > 0 && <section className="answer-notice"><span><MessageCircleQuestion /></span><div><strong>質問への回答が届いています</strong><p>内容を確認し、疑問が解消したら「解決済み」にしてください。</p></div><button className="button primary small" onClick={() => router.push("/dashboard?tab=questions")}>回答を見る</button></section>}
  </>;
}
