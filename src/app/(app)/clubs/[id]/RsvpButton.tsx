"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function RsvpButton({ meetingId, initialIds, userId, colorHex }: {
  meetingId: string;
  initialIds: string[];
  userId: string;
  colorHex: string;
}) {
  const [ids, setIds] = useState(initialIds);
  const [loading, setLoading] = useState(false);
  const isGoing = ids.includes(userId);

  async function toggle() {
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
      className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-60"
      style={isGoing
        ? { backgroundColor: `#${colorHex}`, color: "white" }
        : { backgroundColor: "#E7E7EC", color: "#374151" }
      }
    >
      {isGoing ? "I'm in ✓" : "RSVP"}
    </button>
  );
}
