"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const HOME_COLOR = "#7A1F2E";

export default function SettingsPage() {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: HOME_COLOR }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Settings</h1>
        </div>
      </div>

      <div className="-mt-10 space-y-4 px-5 pb-8">
        {/* Account */}
        <div className="card-shadow overflow-hidden rounded-[20px]" style={{ background: "var(--card)" }}>
          <p className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            Account
          </p>
          <Link
            href="/profile"
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Edit profile
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
          <div className="border-t border-gray-100" />
          <button
            onClick={signOut}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
          >
            Sign out
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* About */}
        <div className="card-shadow overflow-hidden rounded-[20px]" style={{ background: "var(--card)" }}>
          <p className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
            About
          </p>
          <div className="px-5 py-4">
            <p className="text-sm font-semibold text-gray-900">Crew</p>
            <p className="text-xs text-gray-400 mt-0.5">Plano Senior High · Club Hub</p>
          </div>
        </div>
      </div>
    </div>
  );
}
