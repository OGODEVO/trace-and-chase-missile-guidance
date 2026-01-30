import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trace & Chase - Missile Command",
  description: "A 3D missile evasion game with realistic guidance physics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-900">{children}</body>
    </html>
  );
}
