import type { Metadata } from "next";
import { Turret_Road, Space_Grotesk } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const turretRoad = Turret_Road({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
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
    <html lang="en" className={`${turretRoad.variable} ${spaceGrotesk.variable} h-full`}>
      <body className="flex min-h-full flex-col bg-[#0a0a0a] text-white antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
