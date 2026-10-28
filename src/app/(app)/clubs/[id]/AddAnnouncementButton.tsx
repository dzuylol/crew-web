"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddAnnouncementButton({ clubId, colorHex }: { clubId: string; colorHex: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function reset() { setTitle(""); setBody(""); setOpen(false); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("announcements").insert({
      club_id: clubId,
      title: title.trim(),
      body: body.trim(),
      date: new Date().toISOString(),
      is_read: false,
    });
    router.refresh();
    reset();
    setSaving(false);
  }

  const inp = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-[var(--card)] text-[var(--foreground)]";

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full rounded-full border py-2.5 text-sm font-semibold"
      style={{ borderColor: `#${colorHex}`, color: `#${colorHex}` }}>
      + Post announcement
    </button>
  );

  return (
    <form onSubmit={submit} className="card-shadow rounded-[18px] bg-white p-4 space-y-3">
      <p className="font-semibold text-gray-900">New announcement</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" required className={inp} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message (optional)"
        rows={3} className={inp + " resize-none"} />
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="flex-1 rounded-full bg-gray-100 py-2.5 text-sm font-semibold text-gray-600">Cancel</button>
        <button type="submit" disabled={saving || !title.trim()}
          className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: `#${colorHex}` }}>
          {saving ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
