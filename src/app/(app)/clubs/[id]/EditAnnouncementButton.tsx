"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Announcement } from "@/types";

const inp = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white text-gray-900";

export default function EditAnnouncementButton({ announcement, colorHex }: {
  announcement: Announcement;
  colorHex: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(announcement.title);
  const [body, setBody] = useState(announcement.body ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("announcements").update({
      title: title.trim(),
      body: body.trim(),
    }).eq("id", announcement.id);
    router.refresh();
    setOpen(false);
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        title="Edit announcement"
      >
        <Pencil size={13} className="text-gray-400" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 border-t border-gray-100 pt-3 space-y-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit announcement</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" required className={inp} />
      <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message"
        rows={3} className={inp + " resize-none"} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)}
          className="flex-1 rounded-full bg-gray-100 py-2 text-sm font-semibold text-gray-600">
          Cancel
        </button>
        <button type="submit" disabled={saving || !title.trim()}
          className="flex-1 rounded-full py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: `#${colorHex}` }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
