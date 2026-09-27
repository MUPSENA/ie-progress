"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { apiFetch } from "@/lib/client-utils";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  const passwordChecks = {
    length: password.length >= 10,
    letter: /[A-Za-z]/.test(password),
    number: /\d/.test(password),
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("確認用パスワードが一致しません");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "登録できませんでした");
    } finally {
      setLoading(false);
    }
  }

  if (complete) {
    return (
      <main className="signup-page">
        <section className="signup-complete" aria-live="polite">
          <span className="complete-icon"><CheckCircle2 size={38} /></span>
          <p className="eyebrow">ACCOUNT CREATED</p>
          <h1>登録が完了しました</h1>
          <p>{name}さん、ようこそ。アカウントを安全に作成し、ログインしました。</p>
          <div className="signup-next-step"><ShieldCheck size={22} /><span><strong>次に、役割と参加現場を設定します</strong><small>管理者からの招待後、あなたに必要な画面だけが表示されます。</small></span></div>
          <button className="button primary large" onClick={() => { router.push("/client"); router.refresh(); }}>Auri+を開く</button>
          <Link className="button text" href="/">トップページへ戻る</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="signup-page">
      <header className="signup-header">
        <Link href="/" aria-label="Auri+ トップ"><BrandLogo className="signup-brand-logo" priority /></Link>
        <span>すでにアカウントをお持ちですか？ <Link href="/login">ログイン</Link></span>
      </header>
      <div className="signup-layout">
        <section className="signup-guide" aria-label="登録のご案内">
          <Link className="signup-back" href="/"><ArrowLeft size={16} />トップページへ</Link>
          <p className="eyebrow light">START WITH ONE ACCOUNT</p>
          <h1>まずは、ひとつの<br />アカウントから。</h1>
          <p>ログイン方法は全員共通です。役割と参加する現場に応じて、利用できる機能が安全に切り替わります。</p>
          <ol>
            <li><span>1</span><div><strong>アカウントを作成</strong><small>お名前、メールアドレス、パスワードだけ</small></div></li>
            <li><span>2</span><div><strong>役割を設定</strong><small>管理者がRoleを設定します</small></div></li>
            <li><span>3</span><div><strong>現場へ参加</strong><small>招待されたProjectだけを表示します</small></div></li>
          </ol>
        </section>

        <section className="signup-form-panel">
          <div className="signup-card">
            <p className="eyebrow">CREATE ACCOUNT</p>
            <h2>招待アカウント登録</h2>
            <p className="muted">管理者から招待された方の登録画面です</p>
            <form className="stack-lg" onSubmit={submit} noValidate>
              <label className="field"><span>お名前</span><input name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="例：山田 太郎" minLength={2} maxLength={60} required /></label>
              <label className="field"><span>メールアドレス</span><input name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="name@example.jp" maxLength={254} required /></label>
              <label className="field"><span>パスワード</span><input name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={100} required aria-describedby="password-rules" /></label>
              <div className="password-rules" id="password-rules">
                <span className={passwordChecks.length ? "passed" : ""}><Check size={13} />10文字以上</span>
                <span className={passwordChecks.letter ? "passed" : ""}><Check size={13} />英字を含む</span>
                <span className={passwordChecks.number ? "passed" : ""}><Check size={13} />数字を含む</span>
              </div>
              <label className="field"><span>パスワード（確認）</span><input name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" minLength={10} maxLength={100} required /></label>
              {error && <div className="alert error" role="alert">{error}</div>}
              <button className="button primary large" type="submit" disabled={loading}>{loading ? <><Loader2 className="spin" size={18} />登録しています...</> : "アカウントを作成"}</button>
            </form>
            <p className="signup-security"><LockKeyhole size={15} />パスワードは暗号化して保存されます</p>
          </div>
        </section>
      </div>
    </main>
  );
}
