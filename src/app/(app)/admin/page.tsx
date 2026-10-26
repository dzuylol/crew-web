"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Club, AppUser, ClubCategory } from "@/types";
import { CATEGORIES, PALETTE_HEXES } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

const ADMIN_COLOR = "#7A1F2E";

export default function AdminPage() {
  const [me, setMe] = useState<AppUser | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [tab, setTab] = useState<"clubs" | "pending" | "new">("clubs");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
      if (!profile?.is_super_admin) { router.push("/"); return; }
      setMe(profile as AppUser);
      const [{ data: c }, { data: u }] = await Promise.all([
        supabase.from("clubs").select("*").order("name"),
        supabase.from("users").select("*").order("first_name"),
      ]);
      setClubs((c ?? []) as Club[]);
      setUsers((u ?? []) as AppUser[]);
      setLoading(false);
    }
    load();
  }, [router]);

  async function approveClub(id: string) {
    const supabase = createClient();
    await supabase.from("clubs").update({ is_pending: false }).eq("id", id);
    setClubs((prev) => prev.map((c) => c.id === id ? { ...c, is_pending: false } : c));
  }

  async function deleteClub(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    await supabase.from("clubs").delete().eq("id", id);
    setClubs((prev) => prev.filter((c) => c.id !== id));
  }

  async function promoteToOfficer(clubId: string, userId: string) {
    const supabase = createClient();
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;
    const newOfficers = [...new Set([...club.officer_ids, userId])];
    const newMembers = club.member_ids.filter((id) => id !== userId);
    await supabase.from("clubs").update({ officer_ids: newOfficers, member_ids: newMembers }).eq("id", clubId);
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, officer_ids: newOfficers, member_ids: newMembers } : c));
  }

  async function demoteToMember(clubId: string, userId: string) {
    const supabase = createClient();
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;
    const newOfficers = club.officer_ids.filter((id) => id !== userId);
    const newMembers = [...new Set([...club.member_ids, userId])];
    await supabase.from("clubs").update({ officer_ids: newOfficers, member_ids: newMembers }).eq("id", clubId);
    setClubs((prev) => prev.map((c) => c.id === clubId ? { ...c, officer_ids: newOfficers, member_ids: newMembers } : c));
  }

  if (loading) return (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#7A1F2E]" />
    </div>
  );

  const activeClubs = clubs.filter((c) => !c.is_pending);
  const pendingClubs = clubs.filter((c) => c.is_pending);

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: ADMIN_COLOR }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Admin</h1>
            <p className="text-xs opacity-70">{pendingClubs.length} pending review</p>
          </div>
        </div>
      </div>

      <div className="-mt-10 space-y-4 px-5 pb-8">
        {/* Tab bar */}
        <div className="card-shadow flex rounded-full bg-white p-1">
          {(["clubs", "pending", "new"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 rounded-full py-2 text-xs font-semibold transition-colors capitalize"
              style={tab === t ? { backgroundColor: ADMIN_COLOR, color: "white" } : { color: "#6B7280" }}
            >
              {t === "pending" ? `Pending · ${pendingClubs.length}` : t === "new" ? "+ New club" : `Clubs · ${activeClubs.length}`}
            </button>
          ))}
        </div>

        {tab === "clubs" && (
          <div className="space-y-3">
            {activeClubs.map((club) => (
              <ClubAdminCard
                key={club.id}
                club={club}
                users={users}
                onDelete={() => deleteClub(club.id, club.name)}
                onPromote={(uid) => promoteToOfficer(club.id, uid)}
                onDemote={(uid) => demoteToMember(club.id, uid)}
              />
            ))}
          </div>
        )}

        {tab === "pending" && (
          <div className="space-y-3">
            {pendingClubs.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No clubs pending review.</p>
            ) : (
              pendingClubs.map((club) => (
                <div key={club.id} className="card-shadow rounded-[18px] bg-white p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <ClubIcon colorHex={club.color_hex} size={40} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900">{club.name}</p>
                      <p className="text-xs text-gray-500">{club.category} · {club.meeting_frequency}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{club.description}</p>
                  <div className="flex gap-2">
                    <button onClick={() => approveClub(club.id)}
                      className="flex-1 rounded-full py-2 text-sm font-semibold text-white"
                      style={{ backgroundColor: ADMIN_COLOR }}>
                      Approve
                    </button>
                    <button onClick={() => deleteClub(club.id, club.name)}
                      className="flex-1 rounded-full bg-red-50 py-2 text-sm font-semibold text-red-500">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "new" && me && (
          <NewClubForm adminId={me.id} onCreated={(club) => {
            setClubs((prev) => [...prev, club]);
            setTab("clubs");
          }} />
        )}
      </div>
    </div>
  );
}

function ClubAdminCard({ club, users, onDelete, onPromote, onDemote }: {
  club: Club;
  users: AppUser[];
  onDelete: () => void;
  onPromote: (uid: string) => void;
  onDemote: (uid: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const allMemberIds = [...new Set([club.admin_id, ...club.officer_ids, ...club.member_ids])];
  const memberUsers = allMemberIds.map((id) => users.find((u) => u.id === id)).filter(Boolean) as AppUser[];

  function roleFor(uid: string) {
    if (club.admin_id === uid) return "admin";
    if (club.officer_ids.includes(uid)) return "officer";
    return "member";
  }

  return (
    <div className="card-shadow rounded-[18px] bg-white overflow-hidden">
      <button onClick={() => setExpanded((e) => !e)} className="flex w-full items-center gap-3 p-4">
        <ClubIcon colorHex={club.color_hex} size={36} />
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-gray-900">{club.name}</p>
          <p className="text-xs text-gray-400">{allMemberIds.length} members · {club.category}</p>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"
          style={{ transform: expanded ? "rotate(90deg)" : undefined, transition: "transform 0.2s" }}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 space-y-3">
          <div className="space-y-2 pt-3">
            {memberUsers.map((u) => {
              const role = roleFor(u.id);
              return (
                <div key={u.id} className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{u.first_name} {u.last_name}</span>
                    <span className="ml-2 text-xs text-gray-400">{role}</span>
                  </div>
                  {role === "member" && (
                    <button onClick={() => onPromote(u.id)}
                      className="rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{ backgroundColor: "#8470C818", color: "#8470C8" }}>
                      → Officer
                    </button>
                  )}
                  {role === "officer" && (
                    <button onClick={() => onDemote(u.id)}
                      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                      → Member
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={onDelete} className="w-full rounded-full bg-red-50 py-2 text-sm font-semibold text-red-400">
            Delete club
          </button>
        </div>
      )}
    </div>
  );
}

function NewClubForm({ adminId, onCreated }: { adminId: string; onCreated: (club: Club) => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ClubCategory>("STEM");
  const [frequency, setFrequency] = useState("Weekly");
  const [colorIdx, setColorIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { data, error: err } = await supabase.from("clubs").insert({
      name: name.trim(),
      description: description.trim(),
      category,
      meeting_frequency: frequency,
      color_hex: PALETTE_HEXES[colorIdx],
      icon_name: "users",
      admin_id: adminId,
      officer_ids: [],
      member_ids: [],
      is_pending: false,
    }).select().single();
    if (err) { setError(err.message); setSaving(false); return; }
    onCreated(data as Club);
  }

  const inputClass = "w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#7A1F2E]";

  return (
    <form onSubmit={submit} className="space-y-4">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name" className={inputClass} style={{ background: "var(--card)", color: "var(--foreground)" }} />
      <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" rows={3} className={inputClass + " resize-none"} style={{ background: "var(--card)", color: "var(--foreground)" }} />
      <select value={category} onChange={(e) => setCategory(e.target.value as ClubCategory)} className={inputClass} style={{ background: "var(--card)", color: "var(--foreground)" }}>
        {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
      </select>
      <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass} style={{ background: "var(--card)", color: "var(--foreground)" }}>
        {["Weekly", "Biweekly", "Monthly", "As needed"].map((f) => <option key={f}>{f}</option>)}
      </select>

      {/* Color picker */}
      <div>
        <p className="mb-2 text-xs font-semibold text-gray-500">Club color</p>
        <div className="flex flex-wrap gap-2">
          {PALETTE_HEXES.map((hex, i) => (
            <button key={hex} type="button" onClick={() => setColorIdx(i)}
              className="h-8 w-8 rounded-full transition-transform"
              style={{ backgroundColor: `#${hex}`, transform: colorIdx === i ? "scale(1.2)" : undefined, outline: colorIdx === i ? `2px solid #${hex}` : undefined, outlineOffset: "2px" }}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button type="submit" disabled={saving || !name.trim()}
        className="w-full rounded-full py-3 font-semibold text-white disabled:opacity-50"
        style={{ backgroundColor: ADMIN_COLOR }}>
        {saving ? "Creating…" : "Create club"}
      </button>
    </form>
  );
}
