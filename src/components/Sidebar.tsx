"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Home, CalendarDays, Users, Settings, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { AppUser } from "@/types";
import { stableColor, displayName } from "@/types";

const NAV = [
  { href: "/", icon: Home, label: "Home", color: "#7A1F2E" },
  { href: "/schedule", icon: CalendarDays, label: "Schedule", color: "#3B5EA5" },
  { href: "/clubs", icon: Users, label: "Clubs", color: "#8470C8" },
];

export default function Sidebar({ profile }: { profile: AppUser | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const name = profile ? displayName(profile) : null;
  const initials = name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : null;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-dvh w-[220px] flex-col border-r border-gray-100 bg-white z-40">
      {/* Logo */}
      <div className="flex items-center px-4 py-5 border-b border-gray-100">
        <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gray-900 shadow-sm">
          <Image src="/paw-logo.png" alt="Crew" width={30} height={30} className="invert" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ href, icon: Icon, label, color }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-colors"
              style={active
                ? { backgroundColor: `${color}18`, color }
                : { color: "#6B7280" }
              }
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-3 space-y-1">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          <Settings size={17} />
          Settings
        </Link>

        {profile ? (
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-gray-50"
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: stableColor(profile.id) }}
            >
              {initials}
            </div>
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-semibold text-gray-900">{name}</p>
              <p className="text-xs text-gray-400">Sign out</p>
            </div>
          </button>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-gray-50"
            style={{ color: "#7A1F2E" }}
          >
            <LogIn size={17} />
            Sign in
          </Link>
        )}
      </div>
    </aside>
  );
}
