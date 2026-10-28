"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AttendeeProfile = { id: string; first_name: string; last_name: string };

function initials(p: AttendeeProfile) {
  return `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

function avatarBg(id: string) {
  const palette = ["#8470C8", "#3B6EA5", "#E0922B", "#2E8B8B", "#A8456B", "#4F8F4F", "#C9A227", "#6A4C93"];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(h) % palette.length];
}

export default function RsvpSection({ meetingId, initialIds, userId, colorHex, attendeeProfiles }: {
  meetingId: string;
  initialIds: string[];
  userId: string;
  colorHex: string;
  attendeeProfiles: AttendeeProfile[];
}) {
  const [ids, setIds] = useState(initialIds);
  const [loading, setLoading] = useState(false);
  const isGoing = ids.includes(userId);

  const profileMap = new Map(attendeeProfiles.map((p) => [p.id, p]));
  const goingProfiles = ids.map((id) => profileMap.get(id)).filter(Boolean) as AttendeeProfile[];
  const shown = goingProfiles.slice(0, 5);
  const extra = Math.max(0, goingProfiles.length - 5);

  async function toggle() {
    setLoading(true);
    const supabase = createClient();
    await supabase.rpc("toggle_rsvp", { meeting_id: meetingId });
    setIds(isGoing ? ids.filter((id) => id !== userId) : [...ids, userId]);
    setLoading(false);
  }

  return (
    <div className="mt-2.5 flex items-center gap-2">
      {/* Avatar stack */}
      {shown.length > 0 && (
        <div className="flex items-center shrink-0">
          {shown.map((p, i) => (
            <div
              key={p.id}
              title={`${p.first_name} ${p.last_name}`}
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full text-[9px] font-black text-white ring-[1.5px] ring-white"
              style={{ backgroundColor: avatarBg(p.id), marginLeft: i > 0 ? -7 : 0, zIndex: shown.length - i }}
            >
              {initials(p)}
            </div>
          ))}
          {extra > 0 && (
            <div
              className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-gray-200 text-[9px] font-bold text-gray-500 ring-[1.5px] ring-white"
              style={{ marginLeft: -7 }}
            >
              +{extra}
            </div>
          )}
        </div>
      )}

      {/* Count */}
      <span className="text-xs text-gray-400 flex-1 min-w-0 truncate">
        {ids.length > 0 ? `${ids.length} going` : "Be the first"}
      </span>

      {/* RSVP button */}
      <button
        onClick={toggle}
        disabled={loading}
        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
        style={isGoing
          ? { backgroundColor: `#${colorHex}`, color: "white" }
          : { backgroundColor: "#E7E7EC", color: "#374151" }}
      >
        {isGoing ? "I'm in ✓" : "RSVP"}
      </button>
    </div>
  );
}
