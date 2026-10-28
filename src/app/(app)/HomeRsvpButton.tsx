"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const PRIMARY = "#7A1F2E";

export default function HomeRsvpButton({ meetingId, initialIds, userId }: {
  meetingId: string;
  initialIds: string[];
  userId: string;
}) {
  const [ids, setIds] = useState(initialIds);
  const [loading, setLoading] = useState(false);
  const isGoing = ids.includes(userId);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    const supabase = createClient();
    await supabase.rpc("toggle_rsvp", { meeting_id: meetingId });
    setIds(isGoing ? ids.filter((id) => id !== userId) : [...ids, userId]);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50"
      style={isGoing
        ? { backgroundColor: "#1C1C1E", color: "white" }
        : { backgroundColor: "#F3F4F6", color: "#6B7280" }}
    >
      {isGoing ? "I'm in ✓" : "I'm in"}
    </button>
  );
}
