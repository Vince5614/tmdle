"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";

function SupportModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-white/10 bg-[#111] p-7 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
          <span className="text-2xl">🎮</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-1" style={{ fontFamily: "var(--font-display)" }}>
          Made by chilly
        </h2>
        <p className="text-xs text-gray-500 mb-5 leading-relaxed">
          Trackmania streamer, speedrunner, and creator of TMDLE — a daily games hub for the TM community.
        </p>
        <a
          href="https://www.twitch.tv/chilly7383"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-3 flex items-center justify-center gap-2 w-full rounded-xl py-3 text-sm font-semibold transition-all"
          style={{ backgroundColor: "#9146ff", color: "#fff", fontFamily: "var(--font-display)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/>
          </svg>
          Follow on Twitch
        </a>
        <button
          onClick={onClose}
          className="w-full rounded-xl border border-white/10 py-2.5 text-xs text-gray-500 transition-colors hover:text-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const { isSignedIn, isLoaded } = useUser();

  return (
    <>
      {supportOpen && <SupportModal onClose={() => setSupportOpen(false)} />}

      <nav className="sticky top-0 z-40 border-b border-white/10 bg-[#0f0f0f]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-2">
            <span
              className="text-2xl font-black tracking-widest bg-gradient-to-r from-white via-cyan-300 to-blue-500 bg-clip-text text-transparent"
              style={{ fontFamily: "var(--font-display)" }}
            >
              TMDLE
            </span>
            <span className="text-xs font-medium text-cyan-400">by chilly</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-5 text-sm font-medium text-gray-400 md:flex">
            <Link href="/" className="transition-colors hover:text-white">Games</Link>
            <Link href="/mapguessr" className="transition-colors hover:text-white">MapGuessr</Link>
            <Link href="/profile" className="transition-colors hover:text-white">Profile</Link>

            {/* Support button */}
            <button
              onClick={() => setSupportOpen(true)}
              className="transition-colors hover:text-white"
            >
              Support
            </button>

            {isLoaded && !isSignedIn && (
              <SignInButton mode="modal">
                <button className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/15">
                  Sign in
                </button>
              </SignInButton>
            )}
            {isLoaded && isSignedIn && (
              <Link
                href="/profile"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-400 transition-all hover:border-cyan-500/30 hover:text-cyan-400"
                title="Profile"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              </Link>
            )}
          </div>

          {/* Hamburger (mobile) */}
          <button
            className="flex flex-col gap-1.5 p-1 md:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-6 bg-white transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-6 bg-white transition-transform ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-white/10 px-6 py-4 md:hidden">
            <ul className="flex flex-col gap-4 text-sm font-medium">
              <li><Link href="/" className="text-gray-300 transition-colors hover:text-white" onClick={() => setMenuOpen(false)}>Games</Link></li>
              <li><Link href="/mapguessr" className="text-gray-300 transition-colors hover:text-white" onClick={() => setMenuOpen(false)}>MapGuessr</Link></li>
              <li><Link href="/profile" className="text-gray-300 transition-colors hover:text-white" onClick={() => setMenuOpen(false)}>Profile</Link></li>
              <li>
                <button
                  onClick={() => { setMenuOpen(false); setSupportOpen(true); }}
                  className="text-gray-300 transition-colors hover:text-white"
                >
                  About / Support
                </button>
              </li>
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}
