"use client";

import { useMemo, useState } from "react";
import { Camera, ImagePlus, Loader2, Save, Send } from "lucide-react";
import type { DashboardData, OfflineDraft, Project } from "@/types/dashboard";
import { apiFetch, compressImage } from "@/lib/client-utils";

const DRAFT_KEY = "ie-progress-report-drafts";
export function readDrafts(): OfflineDraft[] { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]"); } catch { return []; } }
export function writeDrafts(drafts: OfflineDraft[]) { localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts)); window.dispatchEvent(new Event("drafts-updated")); }

export function ReportForm({ project, defaultScheduleId, onComplete, onDraft }: { project: Project; defaultScheduleId?: string; onComplete: () => void; onDraft: () => void }) {
  const days = project.schedules.filter((item) => item.level === "DAY");
  const [scheduleId, setScheduleId] = useState(defaultScheduleId || days[0]?.id || "");
  const selected = days.find((item) => item.id === scheduleId);
  const [progress, setProgress] = useState(selected?.progress ?? 0);
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [prepared, setPrepared] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function chooseFile(value: File | null) {
    if (!value) return; setError(""); setFile(value);
    try { const result = await compressImage(value); setPrepared(result); setPreview(result.dataUrl); }
    catch { setError("写真を読み込めませんでした。別の写真を選択してください。"); }
  }
  async function saveDraft() {
    if (!prepared || !scheduleId || comment.trim().length < 2) { setError("工程・写真・コメントを入力してください"); return false; }
    const draft: OfflineDraft = { id: crypto.randomUUID(), projectId: project.id, scheduleItemId: scheduleId, comment: comment.trim(), progress, capturedAt: new Date().toISOString(), fileName: file?.name || "現場写真.jpg", mimeType: prepared.blob.type, dataUrl: prepared.dataUrl, savedAt: new Date().toISOString() };
    writeDrafts([draft, ...readDrafts()]); onDraft(); return true;
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault(); if (!prepared || !file) { setError("写真を撮影または選択してください"); return; }
    setLoading(true); setError("");
    const form = new FormData(); form.set("projectId", project.id); form.set("scheduleItemId", scheduleId); form.set("comment", comment); form.set("progress", String(progress)); form.set("capturedAt", new Date().toISOString()); form.set("photo", new File([prepared.blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: prepared.blob.type }));
    try { await apiFetch("/api/reports", { method: "POST", body: form }); onComplete(); }
    catch (err) {
      if (!navigator.onLine || err instanceof TypeError) { await saveDraft(); return; }
      setError(err instanceof Error ? err.message : "送信できませんでした"); setLoading(false);
    }
  }
  return <form className="modal-body stack-lg" onSubmit={submit}>
    <label className="field"><span>対象の日工程</span><select value={scheduleId} onChange={(e) => { setScheduleId(e.target.value); setProgress(days.find((d) => d.id === e.target.value)?.progress ?? 0); }} required>{days.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
    <label className={`photo-drop ${preview ? "has-photo" : ""}`}>
      {preview ? <><img src={preview} alt="選択した現場写真のプレビュー" /><span><ImagePlus size={18} />写真を変更</span></> : <><span className="camera-circle"><Camera size={28} /></span><strong>現場写真を撮る</strong><small>タップしてカメラを起動・写真を選択</small></>}
      <input type="file" accept="image/*" capture="environment" onChange={(e) => chooseFile(e.target.files?.[0] ?? null)} />
    </label>
    <label className="field"><span>進捗率 <strong className="range-value">{progress}%</strong></span><input type="range" min="0" max="100" step="5" value={progress} onChange={(e) => setProgress(Number(e.target.value))} /><div className="range-labels"><small>未着手</small><small>完了</small></div></label>
    <label className="field"><span>作業内容・連絡事項</span><textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="例：南面の防水シート施工まで完了。端部も確認済みです。" required minLength={2} maxLength={1000} /></label>
    <p className="form-hint">写真は端末内で最大1600px・JPEG品質78%に圧縮してから送信します。</p>
    {error && <div className="alert error" role="alert">{error}</div>}
    <div className="form-actions"><button type="button" className="button secondary" onClick={saveDraft}><Save size={17} />下書き保存</button><button className="button primary" disabled={loading}>{loading ? <><Loader2 className="spin" size={17} />送信中</> : <><Send size={17} />承認依頼を送信</>}</button></div>
  </form>;
}

export function RequestForm({ project, onComplete }: { project: Project; onComplete: () => void }) {
  const days = project.schedules.filter((item) => item.level === "DAY");
  const [scheduleItemId, setScheduleItemId] = useState(days[0]?.id || ""); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [priority, setPriority] = useState("NORMAL"); const [dueAt, setDueAt] = useState(""); const [photo, setPhoto] = useState<{ file: File; blob: Blob; preview: string } | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function choosePhoto(file: File | null) { if (!file) return; try { const prepared = await compressImage(file); setPhoto({ file, blob: prepared.blob, preview: prepared.dataUrl }); } catch { setError("写真を読み込めませんでした"); } }
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); const form = new FormData(); form.set("type", "SITE_REQUEST"); form.set("projectId", project.id); form.set("scheduleItemId", scheduleItemId); form.set("title", title); form.set("content", content); form.set("priority", priority); form.set("dueAt", dueAt); if (photo) form.set("photo", new File([photo.blob], photo.file.name.replace(/\.[^.]+$/, ".jpg"), { type: photo.blob.type })); try { await apiFetch("/api/tasks", { method: "POST", body: form }); onComplete(); } catch (err) { setError(err instanceof Error ? err.message : "登録できませんでした"); setLoading(false); } }
  return <form className="modal-body stack-lg" onSubmit={submit}>
    <div className="form-grid"><label className="field"><span>関連工程</span><select value={scheduleItemId} onChange={(e) => setScheduleItemId(e.target.value)}>{days.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><label className="field"><span>希望期限</span><input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} /></label></div>
    <label className="field"><span>依頼件名</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：照明位置の確認" required minLength={2} maxLength={100} /></label>
    <label className="field"><span>依頼内容</span><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="判断してほしいこと、現場への影響を具体的に入力してください" required minLength={2} maxLength={2000} /></label>
    <label className={`photo-drop request-photo ${photo ? "has-photo" : ""}`}>{photo ? <><img src={photo.preview} alt="依頼写真のプレビュー" /><span><ImagePlus size={18} />写真を変更</span></> : <><span className="camera-circle"><Camera size={24} /></span><strong>現場写真を添付（任意）</strong><small>状況が伝わる写真を撮影・選択</small></>}<input type="file" accept="image/*" capture="environment" onChange={(e) => choosePhoto(e.target.files?.[0] ?? null)} /></label>
    <fieldset className="field"><legend>緊急度</legend><div className="segmented">{[["NORMAL", "通常"], ["HIGH", "高"], ["URGENT", "緊急"]].map(([value, label]) => <button type="button" key={value} onClick={() => setPriority(value)} className={priority === value ? "active" : ""}>{label}</button>)}</div></fieldset>
    {error && <div className="alert error" role="alert">{error}</div>}<button className="button primary large" disabled={loading}>{loading ? <Loader2 className="spin" /> : <Send size={18} />}依頼を登録</button>
  </form>;
}

export function QuestionForm({ data, project, defaultReportId, onComplete }: { data: DashboardData; project: Project; defaultReportId?: string; onComplete: () => void }) {
  const reports = useMemo(() => data.reports.filter((item) => item.projectId === project.id && item.approvalStatus === "APPROVED"), [data.reports, project.id]);
  const [reportId, setReportId] = useState(defaultReportId || reports[0]?.id || ""); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); setLoading(true); setError(""); try { await apiFetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "OWNER_QUESTION", projectId: project.id, targetReportId: reportId, title, content, priority: "NORMAL" }) }); onComplete(); } catch (err) { setError(err instanceof Error ? err.message : "送信できませんでした"); setLoading(false); } }
  return <form className="modal-body stack-lg" onSubmit={submit}>
    <label className="field"><span>質問する報告</span><select value={reportId} onChange={(e) => setReportId(e.target.value)} required>{reports.map((report) => <option key={report.id} value={report.id}>{report.scheduleItem.title}｜{report.comment.slice(0, 30)}</option>)}</select></label>
    <label className="field"><span>質問の件名</span><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例：雨の日の防水について" required minLength={2} maxLength={100} /></label>
    <label className="field"><span>知りたいこと</span><textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="専門用語を気にせず、気になることをご記入ください" required minLength={2} maxLength={2000} /></label>
    <p className="form-hint">ご質問は管理元請けが確認し、必要に応じて現場担当者へ確認します。</p>
    {error && <div className="alert error" role="alert">{error}</div>}<button className="button primary large" disabled={loading}>{loading ? <Loader2 className="spin" /> : <Send size={18} />}質問を送信</button>
  </form>;
}
