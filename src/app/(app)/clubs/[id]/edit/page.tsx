"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Club } from "@/types";
import { canManage } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

const CATEGORIES = ["STEM", "Service", "Games", "Arts", "Other"] as const;
const FREQUENCIES = ["Weekly", "Biweekly", "Monthly", "As needed"] as const;

export default function EditClubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [club, setClub] = useState<Club | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [frequency, setFrequency] = useState<string>("Weekly");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [{ data: clubData }, { data: profile }] = await Promise.all([
        supabase.from("clubs").select("*").eq("id", id).single(),
        supabase.from("users").select("is_super_admin").eq("id", user.id).single(),
      ]);

      if (!clubData) { router.push("/clubs"); return; }
      const c = clubData as Club;
      if (!canManage(c, user.id, profile?.is_super_admin ?? false)) {
        router.push(`/clubs/${id}`);
        return;
      }

      setClub(c);
      setName(c.name);
      setDescription(c.description ?? "");
      setCategory(c.category);
      setFrequency(c.meeting_frequency);
    }
    load();
  }, [id, router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.from("clubs").update({
      name: name.trim(),
      description: description.trim(),
      category,
      meeting_frequency: frequency,
    }).eq("id", id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    router.push(`/clubs/${id}`);
    router.refresh();
  }

  const inp = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400 bg-white";

  if (!club) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: `#${club}` }} />
    </div>
  );

  return (
    <div className="min-h-dvh bg-[#F2F2F7]">
      {/* Header */}
      <div className="rounded-b-[28px] px-5 pt-10 pb-8" style={{ backgroundColor: `#${club.color_hex}` }}>
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => router.back()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <h1 className="text-xl font-bold text-white">Edit club</h1>
        </div>
        <div className="flex items-center gap-3">
          <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={44} />
          <p className="text-white font-semibold text-lg">{club.name}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={save} className="px-5 py-6 space-y-4 max-w-xl">
        {error && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Club name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} required />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={4} placeholder="What is this club about?" className={inp + " resize-none"} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inp}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Frequency</label>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inp}>
              {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" disabled={saving}
          className="w-full rounded-full py-3 text-sm font-bold text-white disabled:opacity-60"
          style={{ backgroundColor: `#${club.color_hex}` }}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </div>
  );
}
