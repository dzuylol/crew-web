"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/types";
import { stableColor } from "@/types";

const HOME_COLOR = "#7A1F2E";

export default function ProfilePage() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [email, setEmail] = useState("");
  const [dark, setDark] = useState(false);
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
    setDark(localStorage.getItem("theme") === "dark");
  }, [router]);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }

  async function saveName() {
    if (!user || !firstName.trim()) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("users").update({ first_name: firstName.trim(), last_name: lastName.trim() }).eq("id", user.id);
    setUser({ ...user, first_name: firstName.trim(), last_name: lastName.trim() });
    setSaving(false);
    setEditMode(false);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const displayName = user ? `${user.first_name} ${user.last_name}`.trim() : "";
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const avatarColor = user ? stableColor(user.id) : HOME_COLOR;

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
        {/* Avatar + name card */}
        <div className="card-shadow rounded-[20px] p-5 text-center" style={{ background: "var(--card)" }}>
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {initial}
          </div>

          {editMode ? (
            <div className="mt-4 space-y-3">
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#7A1F2E]"
                style={{ background: "var(--background)", color: "var(--foreground)" }}
              />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#7A1F2E]"
                style={{ background: "var(--background)", color: "var(--foreground)" }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode(false)}
                  className="flex-1 rounded-full py-2 text-sm font-semibold"
                  style={{ background: "var(--pill)", color: "var(--foreground)" }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveName}
                  disabled={saving}
                  className="flex-1 rounded-full py-2 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: HOME_COLOR }}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-3 text-xl font-bold" style={{ color: "var(--foreground)" }}>
                {displayName || "—"}
              </p>
              <p className="mt-0.5 text-sm" style={{ color: "var(--foreground)", opacity: 0.5 }}>{email}</p>
              <button
                onClick={() => setEditMode(true)}
                className="mt-3 rounded-full px-4 py-1.5 text-xs font-semibold"
                style={{ background: "var(--pill)", color: "var(--foreground)" }}
              >
                Edit name
              </button>
            </>
          )}
        </div>

        {/* Settings */}
        <div className="card-shadow overflow-hidden rounded-[20px]" style={{ background: "var(--card)" }}>
          <p className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground)", opacity: 0.4 }}>
            Appearance
          </p>
          <SettingRow
            label="Dark mode"
            right={
              <button
                onClick={toggleDark}
                className="relative h-7 w-12 rounded-full transition-colors duration-200"
                style={{ backgroundColor: dark ? HOME_COLOR : "#E5E5EA" }}
                aria-label="Toggle dark mode"
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform duration-200"
                  style={{ transform: dark ? "translateX(20px)" : "translateX(2px)" }}
                />
              </button>
            }
          />
        </div>

        {/* Account */}
        <div className="card-shadow overflow-hidden rounded-[20px]" style={{ background: "var(--card)" }}>
          <p className="px-5 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--foreground)", opacity: 0.4 }}>
            Account
          </p>
          <button
            onClick={signOut}
            className="flex w-full items-center justify-between px-5 py-4 text-sm font-semibold text-red-500"
          >
            Sign out
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingRow({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{label}</span>
      {right}
    </div>
  );
}
