"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Meeting } from "@/types";

const inp = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white text-gray-900";

export default function EditMeetingButton({ meeting, colorHex }: { meeting: Meeting; colorHex: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [date, setDate] = useState(meeting.date.slice(0, 16));
  const [block, setBlock] = useState(meeting.block ?? "");
  const [room, setRoom] = useState(meeting.room ?? "");
  const [description, setDescription] = useState(meeting.description ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !date) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("meetings").update({
      title: title.trim(),
      date: new Date(date).toISOString(),
      block: block.trim(),
      room: room.trim(),
      description: description.trim(),
    }).eq("id", meeting.id);
    router.refresh();
    setOpen(false);
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        title="Edit meeting"
      >
        <Pencil size={13} className="text-gray-400" />
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 border-t border-gray-100 pt-3 space-y-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit meeting</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" required className={inp} />
      <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required className={inp} />
      <div className="flex gap-2">
        <input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="Block" className={inp + " flex-1"} />
        <input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room" className={inp + " flex-1"} />
      </div>
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description"
        rows={2} className={inp + " resize-none"} />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)}
          className="flex-1 rounded-full bg-gray-100 py-2 text-sm font-semibold text-gray-600">
          Cancel
        </button>
        <button type="submit" disabled={saving || !title.trim() || !date}
          className="flex-1 rounded-full py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: `#${colorHex}` }}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
