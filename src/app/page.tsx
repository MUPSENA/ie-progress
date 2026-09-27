import type { Metadata } from "next";
import { MarketingHome } from "@/components/MarketingHome";

export const metadata: Metadata = {
  title: "Auri+｜家づくりの時間を、もっと美しく",
  description: "工程・写真・質問を、現場と元請けと施主で安全に共有する住宅向け工程進捗管理サービスです。",
};

export default function Home() {
  return <MarketingHome />;
}
