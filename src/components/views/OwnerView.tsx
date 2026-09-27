"use client";

import { CalendarDays, Camera, Check, CheckCircle2, FileText, HelpCircle, Home, ImageIcon, MessageCircleQuestion } from "lucide-react";
import type { DashboardData, Project } from "@/types/dashboard";
import { formatDate, formatFullDate } from "@/lib/client-utils";
import { EmptyState } from "@/components/DashboardShell";
import { PageHeader, TaskCard } from "@/components/ui/Common";

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

const constructionStages = [
  ["Design", "設計"], ["Foundation", "基礎"], ["Structure", "構造"], ["Exterior", "外装"],
  ["Interior", "内装"], ["Inspection", "検査"], ["Completion", "完成"],
] as const;

function friendlySchedule(title: string) {
  const entry = Object.entries(friendly).find(([key]) => title.includes(key));
  return entry?.[1] ?? { title, description: "一つずつ確認しながら丁寧に工事を進めています。" };
}

function englishDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value)).toUpperCase();
}

export function OwnerView({ data, project, tab, onOpen }: { data: DashboardData; project: Project; tab: string; onOpen: OpenModal }) {
  const reports = data.reports.filter((report) => report.projectId === project.id && report.approvalStatus === "APPROVED");
  const questions = data.tasks.filter((task) => task.projectId === project.id && task.type === "OWNER_QUESTION");
  const months = project.schedules.filter((item) => item.level === "MONTH");
  const overall = months.length ? Math.round(months.reduce((sum, item) => sum + item.progress, 0) / months.length) : 0;
  const active = project.schedules.find((item) => item.level === "DAY" && item.status === "IN_PROGRESS") || project.schedules.find((item) => item.status === "IN_PROGRESS");
  const next = project.schedules.find((item) => item.level === "DAY" && item.status === "NOT_STARTED");
  const friendlyActive = friendlySchedule(active?.title || "準備中");
  const friendlyNext = friendlySchedule(next?.title || "次の工程を調整中");
  const stageIndex = Math.min(6, Math.max(0, Math.floor(overall / 15)));

  if (tab === "progress") return <ProgressTimeline stageIndex={stageIndex} project={project} overall={overall} />;
  if (tab === "photos") return <GalleryView reports={reports} onOpen={onOpen} />;
  if (tab === "schedule") return <ClientSchedule project={project} />;
  if (tab === "documents") return <ClientDocuments />;
  if (tab === "questions") return <><PageHeader eyebrow="MESSAGES" title="メッセージ" text="家づくりについての質問と回答を、案件の記録として残します。" actions={<button className="button primary" onClick={() => onOpen({ type: "question" })}><MessageCircleQuestion size={17} />質問する</button>} /><div className="task-list owner-tasks">{questions.map((task) => <TaskCard key={task.id} task={task} user={data.user} />)}</div>{!questions.length && <EmptyState icon={HelpCircle} title="メッセージはありません" text="工事写真や進み具合について、いつでも質問できます。" />}</>;

  const latest = reports[0];
  return <>
    <PageHeader eyebrow="OUR HOME" title={project.name.replace(" 新築工事", "")} text={`${project.address}｜${formatFullDate(new Date().toISOString())}`} actions={<span className="owner-safe"><CheckCircle2 size={16} />APPROVED CONTENT</span>} />
    <section className="auri-client-overview">
      <div className="auri-client-progress">
        <p>CONSTRUCTION PROGRESS</p>
        <div><strong>{overall}</strong><span>%</span></div>
        <i><b style={{ width: `${overall}%` }} /></i>
        <dl><div><dt>現在の工程</dt><dd>{friendlyActive.title}</dd></div><div><dt>次の工程</dt><dd>{friendlyNext.title}</dd></div><div><dt>完成予定</dt><dd>{new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit" }).format(new Date(project.plannedEndDate))}</dd></div></dl>
      </div>
      <figure className="auri-client-cover">
        {latest?.photos[0] ? <img src={`/api/photos/${latest.photos[0].id}`} alt="最近の施工状況" /> : <span><Home size={58} />写真を準備しています</span>}
        <figcaption><span>{latest ? englishDate(latest.capturedAt) : "OUR HOME"}</span><b>{latest ? friendlySchedule(latest.scheduleItem.title).title : "家づくりの記録"}</b></figcaption>
      </figure>
    </section>

    <section className="auri-current-story">
      <div><p className="eyebrow">NOW & NEXT</p><h2>今のこと、これからのこと。</h2></div>
      <article><span>01</span><div><small>いま、ここです</small><h3>{friendlyActive.title}</h3><p>{friendlyActive.description}</p></div></article>
      <article><span>02</span><div><small>つぎにすること</small><h3>{friendlyNext.title}</h3><p>{friendlyNext.description}</p>{next && <em><CalendarDays size={14} />{formatDate(next.currentStart)}ごろから</em>}</div></article>
    </section>

    <section className="auri-journal">
      <div className="auri-journal-heading"><p className="eyebrow">CONSTRUCTION JOURNAL</p><h2>家ができていく記録</h2><span>{reports.length} STORIES</span></div>
      {latest ? <article><div className="auri-journal-photo">{latest.photos[0] ? <img src={`/api/photos/${latest.photos[0].id}`} alt={`${latest.scheduleItem.title}の施工写真`} /> : <span><Camera size={28} />写真はありません</span>}</div><div className="auri-journal-copy"><time>{englishDate(latest.capturedAt)}</time><p>{latest.scheduleItem.title}</p><h3>{friendlySchedule(latest.scheduleItem.title).title}</h3><span>{latest.comment}</span><button className="auri-text-button" onClick={() => onOpen({ type: "question", reportId: latest.id })}>この記録について質問する</button></div></article> : <EmptyState icon={Camera} title="写真を確認中です" text="施工会社の確認が済んだ写真から順に公開されます。" />}
    </section>
  </>;
}

function ProgressTimeline({ stageIndex, project, overall }: { stageIndex: number; project: Project; overall: number }) {
  return <><PageHeader eyebrow="PROGRESS" title="完成までの道のり" text={`${project.name}｜現在 ${overall}%`} /><section className="auri-stage-timeline">{constructionStages.map(([english, japanese], index) => { const state = index < stageIndex ? "complete" : index === stageIndex ? "current" : "future"; return <article className={state} key={english}><span>{String(index + 1).padStart(2, "0")}</span><div><p>{english}</p><h2>{japanese}</h2></div><em>{state === "complete" ? <><Check size={14} />完了</> : state === "current" ? "現在" : "予定"}</em></article>; })}</section></>;
}

function GalleryView({ reports, onOpen }: { reports: DashboardData["reports"]; onOpen: OpenModal }) {
  return <><PageHeader eyebrow="GALLERY" title="工事写真" text="確認済みの施工写真を、家づくりの記録としてご覧いただけます。" /><div className="auri-gallery">{reports.map((report, index) => <article key={report.id} className={index % 3 === 0 ? "wide" : ""}><div>{report.photos[0] ? <img src={`/api/photos/${report.photos[0].id}`} alt={`${report.scheduleItem.title}の施工写真`} /> : <span><ImageIcon size={30} />写真はありません</span>}</div><footer><time>{englishDate(report.capturedAt)}</time><p>{report.scheduleItem.title}</p><h2>{friendlySchedule(report.scheduleItem.title).title}</h2><span>{report.comment}</span><button className="auri-text-button" onClick={() => onOpen({ type: "question", reportId: report.id })}>この写真について質問する</button></footer></article>)}</div>{!reports.length && <EmptyState icon={ImageIcon} title="公開中の写真はありません" text="確認済みの写真が届くまで、もう少しお待ちください。" />}</>;
}

function ClientSchedule({ project }: { project: Project }) {
  const upcoming = project.schedules.filter((item) => item.status !== "DONE").sort((a, b) => a.currentStart.localeCompare(b.currentStart));
  return <><PageHeader eyebrow="SCHEDULE" title="これからの予定" text="天候や現場状況により変更になる場合があります。" /><section className="auri-upcoming"><h2>Upcoming</h2>{upcoming.map((item) => <article key={item.id}><time><b>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(item.currentStart)).toUpperCase()}</b><strong>{new Date(item.currentStart).getDate()}</strong></time><div><small>{item.level === "DAY" ? "DAILY WORK" : item.level === "WEEK" ? "WEEKLY PLAN" : "MONTHLY PLAN"}</small><h3>{item.title}</h3><p>{friendlySchedule(item.title).description}</p></div><span>{item.progress}%</span></article>)}</section></>;
}

function ClientDocuments() {
  const categories = ["契約書", "図面", "仕様書", "見積書", "保証書", "取扱説明書"];
  return <><PageHeader eyebrow="DOCUMENTS" title="住まいの書類" text="契約からお引き渡し後まで、大切な資料をひとつの場所に。" /><section className="auri-document-list client-documents">{categories.map((name, index) => <article key={name}><span>{String(index + 1).padStart(2, "0")}</span><FileText size={20} /><div><strong>{name}</strong><small>共有された資料はここに表示されます</small></div><em>—</em></article>)}</section></>;
}
