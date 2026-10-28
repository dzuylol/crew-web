"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/types";
import { stableColor, PALETTE_HEXES } from "@/types";

const HOME_COLOR = "#7A1F2E";

function avatarColor(user: AppUser) {
  return user.avatar_color_hex ? `#${user.avatar_color_hex}` : stableColor(user.id);
}

export default function ProfilePage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [email, setEmail] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { router.push("/login"); return; }
      setEmail(authUser.email ?? "");
      const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
      if (data) {
        setUser(data as AppUser);
        setFirstName(data.first_name);
        setLastName(data.last_name);
      }
    }
    load();
  }, [router]);

  async function saveName() {
    if (!user || !firstName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("users").update({ first_name: firstName.trim(), last_name: lastName.trim() }).eq("id", user.id);
    setUser({ ...user, first_name: firstName.trim(), last_name: lastName.trim() });
    setSaving(false);
    setEditMode(false);
  }

  async function pickColor(hex: string) {
    if (!user) return;
    const supabase = createClient();
    await supabase.from("users").update({ avatar_color_hex: hex }).eq("id", user.id);
    setUser({ ...user, avatar_color_hex: hex });
  }

  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() : "";
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const color = user ? avatarColor(user) : HOME_COLOR;

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      {/* Header */}
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: HOME_COLOR }}>
        <div className="flex items-center gap-3">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="-mt-10 space-y-4 px-5 pb-8">
        {/* Avatar card */}
        <div className="card-shadow rounded-[20px] p-5" style={{ background: "var(--card)" }}>
          <div className="flex items-center gap-4 mb-5">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {initials}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{displayName || "—"}</p>
              <p className="text-sm text-gray-400">{email}</p>
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Circle color</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE_HEXES.map((hex) => {
                const isSelected = user?.avatar_color_hex === hex;
                return (
                  <button
                    key={hex}
                    onClick={() => pickColor(hex)}
                    className="h-8 w-8 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: `#${hex}`,
                      outline: isSelected ? `3px solid #${hex}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Edit name card */}
        <div className="card-shadow rounded-[20px] p-5" style={{ background: "var(--card)" }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Name</p>
          {editMode ? (
            <div className="space-y-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#7A1F2E] bg-white text-gray-900"
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#7A1F2E] bg-white text-gray-900"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 rounded-full bg-gray-100 py-2 text-sm font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveName}
                  disabled={saving || !firstName.trim()}
                  className="flex-1 rounded-full py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: HOME_COLOR }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{displayName || "—"}</span>
              <button
                onClick={() => setEditMode(true)}
                className="rounded-full bg-gray-100 px-4 py-1.5 text-xs font-semibold text-gray-600"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
