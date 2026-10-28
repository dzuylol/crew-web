"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteAnnouncementButton({ announcementId }: { announcementId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Delete this announcement?")) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("announcements").delete().eq("id", announcementId);
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="shrink-0 p-1 rounded-full text-gray-300 hover:text-red-400 transition-colors disabled:opacity-40"
      aria-label="Delete announcement"
    >
      <Trash2 size={14} />
    </button>
  );
}
