import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Auri+｜住まいができるまでを、ひとつにつなぐ", template: "%s｜Auri+" },
  description: "施工会社・現場担当者・施主をつなぐ、上質な住宅施工進捗共有サービス Auri+",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
