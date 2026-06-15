"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import HigherOrLower from "@/components/HigherOrLower";
import type { WrlMap } from "@/lib/wrorlower";

export default function PracticeGate({ deck }: { deck: WrlMap[] }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return <p className="wrl-label">Loading…</p>;

  if (!isSignedIn) {
    return (
      <div className="border border-[#383228] bg-[#1d1a15] p-8 text-center">
        <p className="wrl-condensed mb-2 text-2xl uppercase text-[#eae3d2]">Sign in required</p>
        <p className="wrl-label mx-auto mb-6 max-w-sm">
          Practice mode tracks your runs against your account. The daily game is always free to play without an account.
        </p>
        <SignInButton mode="modal">
          <button className="wrl-btn-primary">Sign in to practice</button>
        </SignInButton>
      </div>
    );
  }

  return <HigherOrLower deck={deck} dayNumber={-1} mode="practice" />;
}
