import Link from "next/link";
import { ArrowDown, ArrowRight, Camera, Check, MessageSquareText, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const journeys = [
  { number: "01", label: "CONSTRUCTION", title: "現場の一日を、丁寧に残す。", text: "工程、写真、確認事項を現場から共有。日々の仕事が、そのまま住まいの記録になります。" },
  { number: "02", label: "TRUST", title: "確認を重ね、安心へ変える。", text: "施工会社が内容を確認してから施主へ公開。伝えるべき情報だけを、静かに、正確に届けます。" },
  { number: "03", label: "MEMORY", title: "完成までの時間も、住まいの一部に。", text: "家が少しずつ形になる瞬間を、写真とことばで美しく積み重ねます。" },
];

export function MarketingHome() {
  return (
    <div className="auri-site">
      <header className="auri-site-header">
        <Link href="/" aria-label="Auri+ トップ"><BrandLogo className="auri-site-logo" priority /></Link>
        <nav aria-label="サイトメニュー"><a href="#concept">Concept</a><a href="#journey">Journey</a><Link href="/login">Login</Link></nav>
      </header>
      <main>
        <section className="auri-site-hero">
          <div className="auri-hero-architecture" aria-hidden="true"><i /><i /><i /></div>
          <div className="auri-hero-copy">
            <p>THE BEAUTY OF BUILDING A HOME</p>
            <h1>住まいができるまでを、<br /><em>ひとつにつなぐ。</em></h1>
            <span>施工会社、現場、施主。家づくりに関わるすべての人が、同じ時間を共有するための場所。</span>
            <Link className="auri-text-link" href="/login">Auri+を開く<ArrowRight size={16} /></Link>
          </div>
          <a className="auri-scroll" href="#concept"><span>SCROLL</span><ArrowDown size={15} /></a>
        </section>

        <section className="auri-concept" id="concept">
          <p className="auri-section-number">01 — CONCEPT</p>
          <div><h2>管理するためではなく、<br />つながるための施工進捗。</h2><p>Auri+は、業務効率だけを追う施工管理ツールではありません。施工の確かさ、住まいへの期待、完成までの記憶。そのすべてを、関わる人たちが美しく共有するためのサービスです。</p></div>
        </section>

        <section className="auri-principles" id="journey">
          {journeys.map((item) => <article key={item.number}><span>{item.number}</span><p>{item.label}</p><h3>{item.title}</h3><small>{item.text}</small></article>)}
        </section>

        <section className="auri-flow">
          <div className="auri-flow-copy"><p className="auri-section-number">02 — ONE JOURNEY</p><h2>ひとつの認証。<br />それぞれの景色。</h2><p>アカウントの入口は全員共通。RoleとProject権限によって、施工会社、現場担当者、施主それぞれに必要な情報だけを届けます。</p><Link className="auri-text-link light" href="/login">ログインへ<ArrowRight size={16} /></Link></div>
          <div className="auri-flow-list"><span><b>ADMIN</b>すべてのプロジェクトと品質を見守る</span><span><b>STAFF</b>担当する現場の今日を記録する</span><span><b>CLIENT</b>自分の住まいが育つ時間を楽しむ</span></div>
        </section>

        <section className="auri-trust">
          <div><ShieldCheck size={23} /><span><b>PRIVATE BY DESIGN</b>現場ごとの厳格な閲覧権限</span></div>
          <div><Check size={23} /><span><b>APPROVED STORIES</b>確認済みの情報だけを施主へ</span></div>
          <div><Camera size={23} /><span><b>BEAUTIFUL RECORDS</b>写真と工程を美しい記録に</span></div>
          <div><MessageSquareText size={23} /><span><b>CONNECTED</b>質問と回答をひとつの流れに</span></div>
        </section>
      </main>
      <footer className="auri-site-footer"><BrandLogo className="auri-footer-logo" /><p>家づくりの時間を、もっと美しく。</p><span>© 2026 AURI+</span></footer>
    </div>
  );
}
