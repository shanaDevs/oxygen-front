import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ThemeProvider } from "@/components/theme-provider";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Oxygen Center - Refilling Management System",
  description: "Complete oxygen refilling center management system with tank monitoring, bottle tracking, supplier and customer management",
};

import { Toaster } from 'sonner';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider defaultTheme="system" storageKey="oxygen-ui-theme">
          <Sidebar />
          <div className="lg:ml-64 min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 p-4 md:p-6">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
