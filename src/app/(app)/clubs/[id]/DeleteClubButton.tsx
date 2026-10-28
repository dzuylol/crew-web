"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2 } from "lucide-react";

export default function DeleteClubButton({ clubId, clubName }: { clubId: string; clubName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Permanently delete "${clubName}"? This cannot be undone.`)) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from("clubs").delete().eq("id", clubId);
    router.push("/clubs");
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-200 hover:bg-red-500/40 transition-colors disabled:opacity-40"
    >
      <Trash2 size={12} />
      {loading ? "Deleting…" : "Delete club"}
    </button>
  );
}
