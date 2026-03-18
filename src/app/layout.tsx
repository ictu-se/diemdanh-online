import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DiemDanh Online",
  description: "Ung dung diem danh online mien phi voi Next.js va Supabase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
