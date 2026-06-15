import type { Metadata } from "next";
import localFont from "next/font/local";
import { Space_Grotesk, Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Titles keep the original TMDLE font
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

// Racing UI fonts for the motorsport theme
const sairaCondensed = Saira_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "TMDLE — Daily Trackmania Games",
  description:
    "A Trackmania community games hub. Daily puzzles and challenges, every day.",
  // The site ships its own dark motorsport palette; tell Dark Reader and
  // similar extensions to leave it alone so the intended colors render.
  other: { "darkreader-lock": "1" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${unbounded.variable} ${spaceGrotesk.variable} ${sairaCondensed.variable} ${plexMono.variable} h-full`}
      >
        <body className="flex min-h-full flex-col bg-[#15130f] text-[#eae3d2] antialiased">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
