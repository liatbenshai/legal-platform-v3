import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "מערכת מסמכים משפטיים",
  description: "מערכת לניהול ויצירת מסמכים משפטיים בעברית",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
