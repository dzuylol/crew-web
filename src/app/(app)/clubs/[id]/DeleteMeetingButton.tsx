"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteMeetingButton({ meetingId }: { meetingId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this meeting?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("meetings").delete().eq("id", meetingId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="shrink-0 p-1 rounded-full text-white/40 hover:text-red-300 transition-colors disabled:opacity-40"
      aria-label="Delete meeting"
    >
      <Trash2 size={14} />
    </button>
  );
}
