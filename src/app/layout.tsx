import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "いえ進捗｜住宅工程管理",
  description: "現場・元請け・施主をつなぐ住宅向け工程進捗管理",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
