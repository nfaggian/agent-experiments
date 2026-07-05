import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Delta Command — Engineering Hub",
  description:
    "Track opportunities, team utilization, and project execution for delta engineering teams.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans bg-surface text-surface-on`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="ml-60 min-h-screen flex-1 bg-surface">{children}</main>
        </div>
      </body>
    </html>
  );
}
