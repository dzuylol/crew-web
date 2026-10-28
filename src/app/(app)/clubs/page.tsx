"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Club, Meeting, Announcement } from "@/types";
import { getRole, relativeDayLabel } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";
import { ChevronRight, Plus } from "lucide-react";

const CLUBS_COLOR = "#8470C8";

export default function ClubsPage() {
  const [tab, setTab] = useState<"joined" | "explore">("joined");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);

      const [{ data: c }, { data: m }, { data: ann }] = await Promise.all([
        supabase.from("clubs").select("*").eq("is_pending", false),
        supabase.from("meetings").select("*").gte("date", new Date().toISOString()).order("date"),
        supabase.from("announcements").select("*").order("date", { ascending: false }).limit(30),
      ]);
      setClubs((c ?? []) as Club[]);
      setMeetings((m ?? []) as Meeting[]);
      setAnnouncements((ann ?? []) as Announcement[]);
      setLoading(false);

      if (user) {
        const { data: profile } = await supabase.from("users").select("is_super_admin").eq("id", user.id).single();
        if (profile?.is_super_admin) {
          setIsSuperAdmin(true);
          const { count } = await supabase.from("clubs").select("id", { count: "exact", head: true }).eq("is_pending", true);
          setPendingCount(count ?? 0);
        }
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#8470C8]" />
      </div>
    );
  }

  const joinedClubs = userId ? clubs.filter((c) => getRole(c, userId) !== null) : [];
  const exploreClubs = userId ? clubs.filter((c) => getRole(c, userId) === null) : clubs;

  function nextMeetingFor(clubId: string) {
    return meetings.find((m) => m.club_id === clubId);
  }

  function latestAnnouncementFor(clubId: string) {
    return announcements.find((a) => a.club_id === clubId);
  }

  async function joinClub(clubId: string) {
    if (!userId) { window.location.href = "/login"; return; }
    const supabase = createClient();
    const club = clubs.find((c) => c.id === clubId);
    if (!club) return;
    const newMemberIds = [...new Set([...club.member_ids, userId])];
    await supabase.from("clubs").update({ member_ids: newMemberIds }).eq("id", clubId);
    setClubs((prev) => prev.map((c) => (c.id === clubId ? { ...c, member_ids: newMemberIds } : c)));
  }

  // "Meeting soon" panel: upcoming meetings from clubs user hasn't joined
  const meetingSoonItems = meetings
    .filter((m) => !joinedClubs.some((c) => c.id === m.club_id))
    .slice(0, 3)
    .map((m) => ({ meeting: m, club: clubs.find((c) => c.id === m.club_id) }))
    .filter((x) => x.club != null) as { meeting: Meeting; club: Club }[];

  return (
    <div className="min-h-dvh bg-[#F2F2F7]">
      {/* Header */}
      <div className="relative overflow-hidden rounded-b-[28px] px-6 pt-8 pb-10 md:px-8" style={{ backgroundColor: CLUBS_COLOR }}>
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -right-4 top-12 h-80 w-80 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-32 -bottom-20 h-72 w-72 rounded-full border border-white/10" />

        <div className="relative flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">Clubs</h1>
            <p className="mt-1 text-sm text-white/70">
              {joinedClubs.length > 0
                ? `You're in ${joinedClubs.length} club${joinedClubs.length !== 1 ? "s" : ""}${joinedClubs.some(c => getRole(c, userId!) === "officer" || getRole(c, userId!) === "admin") ? ` and an officer in ${joinedClubs.filter(c => getRole(c, userId!) === "officer" || getRole(c, userId!) === "admin").length}.` : "."}`
                : userId ? "You haven't joined any clubs yet." : "Browse all clubs at Plano Senior High."}
            </p>
          </div>

          {/* Tab pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab("joined")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={tab === "joined"
                ? { backgroundColor: "white", color: "#1C1C1E" }
                : { backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
              Joined · {joinedClubs.length}
            </button>
            <button
              onClick={() => setTab("explore")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
              style={tab === "explore"
                ? { backgroundColor: "white", color: "#1C1C1E" }
                : { backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}>
              Explore
            </button>
            <Link href="/clubs/create"
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <Plus size={14} />
              Create club
            </Link>
            {isSuperAdmin && pendingCount > 0 && (
              <Link href="/clubs/pending"
                className="flex items-center gap-1.5 rounded-full bg-red-500/80 px-3 py-2 text-xs font-semibold text-white">
                {pendingCount} pending
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-6 md:px-8 md:grid md:grid-cols-[1fr_300px] md:gap-6 md:items-start">
        {/* Main */}
        <div>
          {tab === "joined" ? (
            <JoinedView
              joinedClubs={joinedClubs}
              exploreClubs={exploreClubs}
              userId={userId}
              nextMeetingFor={nextMeetingFor}
              latestAnnouncementFor={latestAnnouncementFor}
              onJoin={joinClub}
              onExplore={() => setTab("explore")}
            />
          ) : (
            <ExploreView
              clubs={exploreClubs}
              userId={userId}
              nextMeetingFor={nextMeetingFor}
              onJoin={joinClub}
            />
          )}
        </div>

        {/* Right panel: Meeting soon */}
        <div className="mt-6 md:mt-0">
          <div className="rounded-2xl bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">Meeting soon</h2>
            </div>
            {meetingSoonItems.length === 0 ? (
              <div className="p-4">
                <p className="text-xs text-gray-400">No upcoming meetings from other clubs.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {meetingSoonItems.map(({ meeting, club }) => {
                  const d = new Date(meeting.date);
                  const dayAbbr = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                  const dayNum = d.getDate();
                  return (
                    <div key={meeting.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex flex-col items-center w-9 shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{dayAbbr}</span>
                        <span className="text-lg font-black text-gray-800 leading-none">{dayNum}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 text-sm truncate">{club.name}</p>
                        <p className="text-xs text-gray-400 truncate">{meeting.description || meeting.title}</p>
                      </div>
                      <button
                        onClick={() => joinClub(club.id)}
                        className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                        Join
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinedView({ joinedClubs, exploreClubs, userId, nextMeetingFor, latestAnnouncementFor, onJoin, onExplore }: {
  joinedClubs: Club[];
  exploreClubs: Club[];
  userId: string | null;
  nextMeetingFor: (id: string) => Meeting | undefined;
  latestAnnouncementFor: (id: string) => Announcement | undefined;
  onJoin: (id: string) => void;
  onExplore: () => void;
}) {
  return (
    <div className="space-y-8">
      {/* Your clubs */}
      <div>
        <h2 className="font-bold text-gray-900 mb-3">Your clubs</h2>
        {joinedClubs.length === 0 ? (
          <div className="rounded-2xl bg-white p-6 text-center">
            <p className="text-sm text-gray-400 mb-2">You haven&apos;t joined any clubs yet.</p>
            <button onClick={onExplore} className="text-sm font-semibold" style={{ color: CLUBS_COLOR }}>
              Explore clubs →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {joinedClubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`}>
                <JoinedClubCard
                  club={club}
                  userId={userId!}
                  nextMeeting={nextMeetingFor(club.id)}
                  latestAnnouncement={latestAnnouncementFor(club.id)}
                />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Discover */}
      {exploreClubs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">Discover</h2>
            <button onClick={onExplore} className="text-xs font-semibold" style={{ color: CLUBS_COLOR }}>
              See all clubs →
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {exploreClubs.slice(0, 4).map((club) => {
              const next = nextMeetingFor(club.id);
              return (
                <DiscoverTile key={club.id} club={club} nextMeeting={next} onJoin={() => onJoin(club.id)} />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ExploreView({ clubs, userId, nextMeetingFor, onJoin }: {
  clubs: Club[];
  userId: string | null;
  nextMeetingFor: (id: string) => Meeting | undefined;
  onJoin: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = clubs.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          placeholder="Search clubs"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {filtered.map((club) => (
          <DiscoverTile key={club.id} club={club} nextMeeting={nextMeetingFor(club.id)} onJoin={() => onJoin(club.id)} />
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">No clubs match your search.</p>
      )}
    </div>
  );
}

function JoinedClubCard({ club, userId, nextMeeting, latestAnnouncement }: {
  club: Club;
  userId: string;
  nextMeeting: Meeting | undefined;
  latestAnnouncement: Announcement | undefined;
}) {
  const role = getRole(club, userId);
  const roleLabel = role === "admin" ? "Admin" : role === "officer" ? "Officer" : "Member";
  const roleColor = role === "officer" || role === "admin" ? "#F59E0B" : "rgba(255,255,255,0.6)";

  const dateStr = nextMeeting
    ? `${new Date(nextMeeting.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${nextMeeting.block} · Room ${nextMeeting.room}`
    : null;

  const isGoing = nextMeeting?.rsvp_user_ids.includes(userId);
  const goingCount = nextMeeting?.rsvp_user_ids.length ?? 0;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: `#${club.color_hex}` }}>
      {/* Top row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={36} />
        <span className="flex-1 font-bold text-white text-base truncate">{club.name}</span>
        <span className="shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
          style={{ borderColor: roleColor, color: roleColor }}>
          {roleLabel}
        </span>
        <ChevronRight size={16} className="shrink-0 text-white/40" />
      </div>

      {/* Meeting info */}
      {dateStr && (
        <div className="px-4 pb-2">
          <p className="text-xs text-white/60">{dateStr}</p>
        </div>
      )}

      {/* Announcement */}
      {latestAnnouncement && (
        <div className="mx-4 mb-3 rounded-xl bg-white/10 px-3 py-2.5">
          <p className="font-semibold text-white text-sm">{latestAnnouncement.title}</p>
          {latestAnnouncement.body && (
            <p className="text-white/70 text-xs mt-0.5 line-clamp-2">{latestAnnouncement.body}</p>
          )}
        </div>
      )}

      {/* Bottom row */}
      <div className="flex items-center justify-between px-4 pb-4 mt-1">
        <span className="text-sm text-white/60">{goingCount} going</span>
        {isGoing && (
          <span className="text-sm font-semibold" style={{ color: "#34D399" }}>✓ You&apos;re in</span>
        )}
        {(role === "officer" || role === "admin") && !isGoing && (
          <div className="flex gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">Edit</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white">Post update</span>
          </div>
        )}
      </div>
    </div>
  );
}

function DiscoverTile({ club, nextMeeting, onJoin }: {
  club: Club;
  nextMeeting: Meeting | undefined;
  onJoin: () => void;
}) {
  const locationStr = nextMeeting
    ? `Room ${nextMeeting.room} · ${nextMeeting.block}`
    : club.category || "";

  return (
    <div className="relative overflow-hidden rounded-2xl p-4 flex flex-col" style={{ backgroundColor: `#${club.color_hex}` }}>
      {/* Decorative circle watermark */}
      <div className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -right-2 -bottom-2 h-16 w-16 rounded-full border border-white/15" />

      <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={36} className="mb-3" />
      <p className="font-bold text-sm text-white leading-tight">{club.name}</p>
      {locationStr && (
        <p className="text-xs text-white/70 mt-0.5 line-clamp-1">{locationStr}</p>
      )}
      <button
        onClick={(e) => { e.preventDefault(); onJoin(); }}
        className="mt-3 w-full rounded-full bg-white/30 py-1.5 text-xs font-bold text-white hover:bg-white/50 transition-colors">
        + Join
      </button>
    </div>
  );
}
