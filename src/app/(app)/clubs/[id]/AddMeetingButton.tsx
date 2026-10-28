"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AddMeetingButton({ clubId, colorHex }: { clubId: string; colorHex: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [block, setBlock] = useState("");
  const [room, setRoom] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  function reset() {
    setTitle(""); setDate(""); setBlock(""); setRoom(""); setDescription("");
    setOpen(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("meetings").insert({
      club_id: clubId,
      title: title.trim(),
      date: new Date(date).toISOString(),
      block: block.trim(),
      room: room.trim(),
      description: description.trim(),
      rsvp_user_ids: [],
    });
    router.refresh();
    reset();
    setSaving(false);
  }

  const inp = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-[var(--card)] text-[var(--foreground)]";

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="w-full rounded-full py-2.5 text-sm font-semibold text-white"
      style={{ backgroundColor: `#${colorHex}` }}>
      + Schedule meeting
    </button>
  );

  return (
    <form onSubmit={submit} className="card-shadow rounded-[18px] bg-white p-4 space-y-3">
      <p className="font-semibold text-gray-900">New meeting</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" required className={inp} />
      <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className={inp} />
      <div className="flex gap-2">
        <input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="Block (e.g. B2)" className={inp + " flex-1"} />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" className={inp + " flex-1"} />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
        rows={2} className={inp + " resize-none"} />
      <div className="flex gap-2">
        <button type="button" onClick={reset} className="flex-1 rounded-full bg-gray-100 py-2.5 text-sm font-semibold text-gray-600">Cancel</button>
        <button type="submit" disabled={saving || !title.trim() || !date}
          className="flex-1 rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: `#${colorHex}` }}>
          {saving ? "Saving…" : "Add meeting"}
        </button>
      </div>
    </form>
  );
}
