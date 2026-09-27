"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { apiFetch } from "@/lib/client-utils";

type LoginResult = { ok: true; role: "ADMIN" | "WORKER" | "OWNER" };

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }) as LoginResult;
      const destination = result.role === "ADMIN" ? "/admin" : result.role === "WORKER" ? "/staff" : "/client";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "ログインできませんでした");
      setLoading(false);
    }
  }

  return (
    <main className="auri-auth-page">
      <Link className="auri-auth-home" href="/">AURI+ / HOME</Link>
      <section className="auri-auth-card" aria-labelledby="login-title">
        <BrandLogo className="auri-auth-logo" priority />
        <p className="auri-auth-message">家づくりの時間を、もっと美しく。</p>
        <div className="auri-auth-heading">
          <p>WELCOME BACK</p>
          <h1 id="login-title">ログイン</h1>
        </div>
        <form onSubmit={submit} className="auri-auth-form">
          <label><span>メールアドレス</span><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.jp" required /></label>
          <label><span>パスワード</span><input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} /></label>
          <div className="auri-login-meta"><span><LockKeyhole size={13} />安全な接続</span><button type="button" onClick={() => setError("パスワードの再設定は、所属会社の管理者へお問い合わせください。")}>パスワードを忘れた方</button></div>
          {error && <div className="alert error" role="alert">{error}</div>}
          <button className="auri-submit" type="submit" disabled={loading}>{loading ? <><Loader2 className="spin" size={17} />確認しています</> : <>ログイン<ArrowRight size={17} /></>}</button>
        </form>
        <p className="auri-invite-note">初めてご利用の方は、管理者から届いた<br />招待URLよりアカウントをご登録ください。</p>
      </section>
      <p className="auri-auth-footer">AURI+ CONSTRUCTION JOURNEY</p>
    </main>
  );
}
