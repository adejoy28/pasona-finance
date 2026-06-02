import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pasona",
  description: "Personal Finance Tracker",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // dark theme friendly
    title: "Pasona",
  },
};

export const viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex items-center justify-center bg-slate-950 text-slate-50 overflow-x-hidden">
        {/*
          Mobile: full screen
          Desktop: phone-frame simulation
        */}
        <div
          className="
            w-full max-w-97.5 min-h-screen
            sm:min-h-0 sm:h-203 sm:my-8
            sm:rounded-[48px]
            sm:border-10 sm:border-zinc-800
            sm:shadow-[0_60px_120px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.06)]
            sm:overflow-hidden
            relative flex flex-col
          "
          style={{
            background: '#0a0a0f',
          }}
        >
          <AuthProvider>
            <main className="flex-1 w-full overflow-y-auto scrollbar-hide bg-slate-950">
              {children}
            </main>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}