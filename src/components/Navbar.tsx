"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-baseline gap-2">
          <span
            className="text-2xl font-black tracking-widest text-white"
            style={{ fontFamily: "var(--font-display)" }}
          >
            TMDLE
          </span>
          <span className="text-xs font-medium text-cyan-400">by chilly</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 text-sm font-medium text-gray-400 md:flex">
          <Link href="/" className="transition-colors hover:text-white">
            Games
          </Link>
          <span className="cursor-not-allowed text-gray-600">About</span>
        </div>

        {/* Hamburger (mobile) */}
        <button
          className="flex flex-col gap-1.5 p-1 md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-white/10 px-6 py-4 md:hidden">
          <ul className="flex flex-col gap-4 text-sm font-medium">
            <li>
              <Link
                href="/"
                className="text-gray-300 transition-colors hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                Games
              </Link>
            </li>
            <li>
              <span className="cursor-not-allowed text-gray-600">About</span>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}
