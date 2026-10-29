"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Club, ClubRole } from "@/types";

export default function JoinLeaveButton({ club, userId, role }: {
  club: Club;
  userId: string;
  role: ClubRole | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function join() {
    setLoading(true);
    const supabase = createClient();
    await supabase.rpc("join_club", { club_id: club.id });
    router.refresh();
    setLoading(false);
  }

  async function leave() {
    if (!confirm(`Leave ${club.name}?`)) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.rpc("leave_club", { club_id: club.id });
    router.refresh();
    setLoading(false);
  }

  if (role === null) {
    return (
      <button
        onClick={join}
        disabled={loading}
        className="w-full rounded-full py-3.5 font-bold text-white text-base disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
        style={{
          backgroundColor: `#${club.color_hex}`,
          boxShadow: `0 6px 20px #${club.color_hex}55, 0 2px 6px rgba(0,0,0,0.12)`,
        }}
      >
        {loading ? "Joining…" : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Join {club.name}
          </>
        )}
      </button>
    );
  }

  if (role === "admin") {
    return null;
  }

  return (
    <div className="flex justify-end">
      <button
        onClick={leave}
        disabled={loading}
        className="rounded-full bg-red-50 px-5 py-2 text-sm font-semibold text-red-500 disabled:opacity-60"
      >
        {loading ? "Leaving…" : "Leave Club"}
      </button>
    </div>
  );
}
