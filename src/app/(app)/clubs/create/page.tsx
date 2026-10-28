"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ClubCategory } from "@/types";
import { CATEGORIES, PALETTE_HEXES, CLUB_ICONS } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

export default function CreateClubPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ClubCategory>("STEM");
  const [frequency, setFrequency] = useState("Weekly");
  const [colorIdx, setColorIdx] = useState(0);
  const [iconName, setIconName] = useState(CLUB_ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Club name is required."); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data, error: err } = await supabase.from("clubs").insert({
      name: name.trim(),
      description: description.trim(),
      category,
      meeting_frequency: frequency,
      color_hex: PALETTE_HEXES[colorIdx],
      icon_name: iconName,
      admin_id: user.id,
      officer_ids: [],
      member_ids: [],
      is_pending: true,
    }).select().single();

    if (err) { setError(err.message); setSaving(false); return; }
    router.push(`/clubs/${data.id}?submitted=1`);
  }

  const inp = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-gray-400 bg-[var(--card)] text-[var(--foreground)]";

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: "#8470C8" }}>
        <div className="flex items-center gap-3">
          <Link href="/clubs" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <h1 className="text-2xl font-bold">Create a club</h1>
        </div>
      </div>

      <form onSubmit={submit} className="-mt-10 space-y-4 px-5 pb-8">
        <div className="card-shadow rounded-[20px] bg-white p-5 space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name *" className={inp} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description — what is this club about?" rows={3} className={inp + " resize-none"} />
        </div>

        <div className="card-shadow rounded-[20px] bg-white p-5 space-y-3">
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">Category</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)}
                  className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
                  style={category === c ? { backgroundColor: "#8470C8", color: "white" } : { backgroundColor: "var(--pill)", color: "var(--foreground)" }}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold text-gray-500">Meeting frequency</p>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inp}>
              {["Weekly", "Biweekly", "Monthly", "As needed"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="card-shadow rounded-[20px] bg-white p-5 space-y-5">
          <div>
            <p className="mb-3 text-xs font-semibold text-gray-500">Club color</p>
            <div className="flex flex-wrap gap-2.5">
              {PALETTE_HEXES.map((hex, i) => (
                <button key={hex} type="button" onClick={() => setColorIdx(i)}
                  className="h-9 w-9 rounded-full transition-transform"
                  style={{
                    backgroundColor: `#${hex}`,
                    transform: colorIdx === i ? "scale(1.2)" : undefined,
                    outline: colorIdx === i ? `2px solid #${hex}` : undefined,
                    outlineOffset: "2px",
                  }}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold text-gray-500">Club icon</p>
            <div className="flex flex-wrap gap-2.5">
              {CLUB_ICONS.map((icon) => {
                const selected = iconName === icon;
                return (
                  <button key={icon} type="button" onClick={() => setIconName(icon)}
                    className="transition-transform"
                    style={{
                      transform: selected ? "scale(1.12)" : undefined,
                      outline: selected ? `2px solid #${PALETTE_HEXES[colorIdx]}` : undefined,
                      outlineOffset: "3px",
                      borderRadius: 14,
                    }}
                  >
                    <ClubIcon
                      colorHex={selected ? PALETTE_HEXES[colorIdx] : "D1D5DB"}
                      iconName={icon}
                      size={56}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="card-shadow rounded-[16px] bg-amber-50 p-4">
          <p className="text-xs font-semibold text-amber-700">Pending review</p>
          <p className="mt-0.5 text-xs text-amber-600">Your club will be reviewed by a super admin before appearing to other students.</p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <button type="submit" disabled={saving || !name.trim()}
          className="w-full rounded-full py-3 font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: "#8470C8" }}>
          {saving ? "Submitting…" : "Submit for review"}
        </button>
      </form>
    </div>
  );
}
