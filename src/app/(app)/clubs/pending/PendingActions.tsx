"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PendingActions({ clubId, clubName }: { clubId: string; clubName: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();

  async function approve() {
    setLoading("approve");
    const supabase = createClient();
    await supabase.from("clubs").update({ is_pending: false }).eq("id", clubId);
    router.refresh();
    setLoading(null);
  }

  async function reject() {
    if (!confirm(`Reject and delete "${clubName}"?`)) return;
    setLoading("reject");
    const supabase = createClient();
    await supabase.from("clubs").delete().eq("id", clubId);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex gap-2">
      <button onClick={approve} disabled={!!loading}
        className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: "#7A1F2E" }}>
        {loading === "approve" ? "Approving…" : "Approve"}
      </button>
      <button onClick={reject} disabled={!!loading}
        className="flex-1 rounded-full bg-red-50 py-2.5 text-sm font-semibold text-red-500 disabled:opacity-50">
        {loading === "reject" ? "Rejecting…" : "Reject"}
      </button>
    </div>
  );
}
