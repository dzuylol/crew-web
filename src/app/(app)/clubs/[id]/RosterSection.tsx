"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Club, AppUser } from "@/types";
import { getRole, stableColor, displayName } from "@/types";

export default function RosterSection({ club, members, currentUserId, isAdmin }: {
  club: Club;
  members: AppUser[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function promote(userId: string) {
    setLoading(userId);
    const supabase = createClient();
    const newOfficers = [...new Set([...club.officer_ids, userId])];
    const newMembers = club.member_ids.filter((id) => id !== userId);
    await supabase.from("clubs").update({ officer_ids: newOfficers, member_ids: newMembers }).eq("id", club.id);
    router.refresh();
    setLoading(null);
  }

  async function demote(userId: string) {
    setLoading(userId);
    const supabase = createClient();
    const newOfficers = club.officer_ids.filter((id) => id !== userId);
    const newMembers = [...new Set([...club.member_ids, userId])];
    await supabase.from("clubs").update({ officer_ids: newOfficers, member_ids: newMembers }).eq("id", club.id);
    router.refresh();
    setLoading(null);
  }

  async function kick(userId: string, name: string) {
    if (!confirm(`Remove ${name} from this club?`)) return;
    setLoading(userId);
    const supabase = createClient();
    const newOfficers = club.officer_ids.filter((id) => id !== userId);
    const newMembers = club.member_ids.filter((id) => id !== userId);
    await supabase.from("clubs").update({ officer_ids: newOfficers, member_ids: newMembers }).eq("id", club.id);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const role = getRole(club, member.id);
        const name = displayName(member);
        const isAdminRow = role === "admin";
        const isOfficerRow = role === "officer";
        const busy = loading === member.id;

        return (
          <div key={member.id} className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: stableColor(member.id) }}
            >
              {name[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{name}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-400 capitalize">{role}</span>
            {isAdmin && !isAdminRow && member.id !== currentUserId && (
              <div className="flex shrink-0 items-center gap-1">
                {isOfficerRow ? (
                  <button onClick={() => demote(member.id)} disabled={busy}
                    className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500 disabled:opacity-50">
                    − Officer
                  </button>
                ) : (
                  <button onClick={() => promote(member.id)} disabled={busy}
                    className="rounded-full px-2 py-0.5 text-xs disabled:opacity-50"
                    style={{ backgroundColor: "#8470C818", color: "#8470C8" }}>
                    + Officer
                  </button>
                )}
                <button onClick={() => kick(member.id, name)} disabled={busy}
                  className="rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-400 disabled:opacity-50">
                  Kick
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
