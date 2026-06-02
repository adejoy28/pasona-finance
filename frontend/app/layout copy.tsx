import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pasona Finance",
  description: "Personal Finance Tracker PWA",
  manifest: "/manifest.json",
  themeColor: "#2563eb",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pasona Finance",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex items-center justify-center bg-slate-50 text-slate-900 overflow-x-hidden">
        {/* Desktop Container Frame */}
        <div className="w-full max-w-md min-h-screen sm:min-h-[85vh] sm:my-8 bg-white sm:rounded-[3rem] sm:border-[8px] sm:border-slate-300 sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.7)] sm:overflow-hidden relative flex flex-col">
          <main className="flex-1 w-full pb-24 overflow-y-auto scrollbar-hide">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
