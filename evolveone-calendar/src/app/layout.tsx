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
  title: "EvolveOne Calendar",
  description: "White-label scheduling software by EvolveOne.",
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
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="mt-16 pb-10">
          <div className="evo-wrap text-[13px] text-black/55">
            EvolveOneAI Limited · 5 Brayford Square, London, United Kingdom, E1 0SG ·{" "}
            <a className="underline underline-offset-4 hover:text-black/80" href="https://www.instagram.com/evolveoneai/" target="_blank" rel="noreferrer">
              Instagram
            </a>{" "}
            ·{" "}
            <a className="underline underline-offset-4 hover:text-black/80" href="https://www.facebook.com/evolveoneai" target="_blank" rel="noreferrer">
              Facebook
            </a>{" "}
            ·{" "}
            <a className="underline underline-offset-4 hover:text-black/80" href="https://x.com/evolveoneai" target="_blank" rel="noreferrer">
              X
            </a>{" "}
            ·{" "}
            <a className="underline underline-offset-4 hover:text-black/80" href="https://www.linkedin.com/company/evolveoneai/" target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
