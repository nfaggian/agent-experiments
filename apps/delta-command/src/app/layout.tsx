import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { Sidebar } from "@/components/layout/Sidebar";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
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
    <html lang="en">
      <body className={`${roboto.variable} font-sans`}>
        <div className="flex min-h-screen bg-surface">
          <Sidebar />
          <main className="ml-64 min-h-screen flex-1 bg-surface">{children}</main>
        </div>
      </body>
    </html>
  );
}
