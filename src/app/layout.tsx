import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const unbounded = localFont({
  src: "../fonts/Unbounded-Regular.ttf",
  variable: "--font-display",
  weight: "400",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TMDLE — Daily Trackmania Games",
  description:
    "A Trackmania community games hub. Daily puzzles and challenges, every day.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${unbounded.variable} ${spaceGrotesk.variable} h-full`}>
        <body className="flex min-h-full flex-col bg-[#0a0a0a] text-white antialiased">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
