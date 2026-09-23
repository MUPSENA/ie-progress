"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, HardHat, Home, Loader2, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/lib/client-utils";

const demos = [
  { label: "管理元請け", email: "admin@example.jp", icon: ShieldCheck },
  { label: "現場担当者", email: "worker@example.jp", icon: HardHat },
  { label: "施主", email: "owner@example.jp", icon: Home },
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.jp");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    try { await apiFetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) }); router.push("/dashboard"); router.refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : "ログインできませんでした"); setLoading(false); }
  }
  return (
    <main className="login-page">
      <section className="login-intro" aria-label="サービス紹介">
        <div className="brand brand-light"><span className="brand-mark"><Building2 size={22} /></span><span>いえ進捗</span></div>
        <div className="login-copy"><p className="eyebrow light">現場から、安心まで。</p><h1>家づくりの今を<br />ひとつにつなぐ。</h1><p>工程・写真・質問を、現場と元請けと施主で安全に共有。今日やることが、迷わず分かります。</p></div>
        <div className="login-points"><span><CheckCircle2 size={17} />承認済みだけを施主へ公開</span><span><CheckCircle2 size={17} />予定変更と操作をすべて記録</span></div>
      </section>
      <section className="login-panel">
        <div className="login-card">
          <div className="mobile-brand brand"><span className="brand-mark"><Building2 size={21} /></span><span>いえ進捗</span></div>
          <p className="eyebrow">WELCOME BACK</p><h2>ログイン</h2><p className="muted">ご利用のアカウントで続けてください</p>
          <div className="demo-switch" aria-label="デモアカウント">
            {demos.map((demo) => <button type="button" key={demo.email} onClick={() => { setEmail(demo.email); setPassword("demo1234"); }} className={email === demo.email ? "active" : ""}><demo.icon size={16} />{demo.label}</button>)}
          </div>
          <form onSubmit={submit} className="stack-lg">
            <label className="field"><span>メールアドレス</span><input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
            <label className="field"><span>パスワード</span><input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label>
            {error && <div className="alert error" role="alert">{error}</div>}
            <button className="button primary large" disabled={loading}>{loading ? <><Loader2 className="spin" size={18} />確認中...</> : "ログインする"}</button>
          </form>
          <p className="demo-note">デモ環境：パスワードはすべて <code>demo1234</code></p>
        </div>
      </section>
    </main>
  );
}
