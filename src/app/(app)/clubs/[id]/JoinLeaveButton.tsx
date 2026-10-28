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
        className="w-full rounded-full py-3 font-semibold text-white disabled:opacity-60"
        style={{ backgroundColor: `#${club.color_hex}` }}
      >
        {loading ? "Joining…" : `Join ${club.name}`}
      </button>
    );
  }

  if (role === "admin") {
    return null;
  }

  return (
    <div className="flex gap-3">
      <button
        className="flex-1 rounded-full py-2.5 text-sm font-semibold"
        style={{ backgroundColor: `#${club.color_hex}18`, color: `#${club.color_hex}` }}
      >
        Invite a friend
      </button>
      <button
        onClick={leave}
        disabled={loading}
        className="flex-1 rounded-full bg-red-50 py-2.5 text-sm font-semibold text-red-500 disabled:opacity-60"
      >
        {loading ? "Leaving…" : "Leave Club"}
      </button>
    </div>
  );
}
