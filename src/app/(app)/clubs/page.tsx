"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Club, Meeting, ClubCategory } from "@/types";
import { getRole, CATEGORIES, relativeDayLabel, allMemberCount } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

const CLUBS_COLOR = "#8470C8";

export default function ClubsPage() {
  const [tab, setTab] = useState<"joined" | "explore">("joined");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<ClubCategory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: c }, { data: m }, { data: profile }] = await Promise.all([
        supabase.from("clubs").select("*").eq("is_pending", false),
        supabase.from("meetings").select("*").gte("date", new Date().toISOString()).order("date"),
        supabase.from("users").select("is_super_admin").eq("id", user.id).single(),
      ]);
      setClubs((c ?? []) as Club[]);
      setMeetings((m ?? []) as Meeting[]);

      if (profile?.is_super_admin) {
        setIsSuperAdmin(true);
        const { count } = await supabase.from("clubs").select("id", { count: "exact", head: true }).eq("is_pending", true);
        setPendingCount(count ?? 0);
      }

      setLoading(false);
    }
    load();
  }, []);

  if (loading || !userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#8470C8]" />
      </div>
    );
  }

  const joinedClubs = clubs.filter((c) => getRole(c, userId) !== null);
  const exploreClubs = clubs.filter((c) => getRole(c, userId) === null);

  const filteredExplore = exploreClubs
    .filter((c) => !category || c.category === category)
    .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const featured = exploreClubs
    .map((c) => ({ club: c, next: meetings.find((m) => m.club_id === c.id) }))
    .filter((x) => x.next)
    .sort((a, b) => new Date(a.next!.date).getTime() - new Date(b.next!.date).getTime())[0]?.club;

  function nextMeetingFor(clubId: string) {
    return meetings.find((m) => m.club_id === clubId);
  }

  async function joinClub(clubId: string) {
    const supabase = createClient();
    const club = clubs.find((c) => c.id === clubId);
    if (!club || !userId) return;
    const newMemberIds = [...new Set([...club.member_ids, userId])];
    await supabase.from("clubs").update({ member_ids: newMemberIds }).eq("id", clubId);
    setClubs((prev) =>
      prev.map((c) => (c.id === clubId ? { ...c, member_ids: newMemberIds } : c))
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Header */}
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: CLUBS_COLOR }}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Clubs</h1>
          <div className="flex items-center gap-2">
            {isSuperAdmin && pendingCount > 0 && (
              <Link href="/clubs/pending"
                className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-400 text-[10px] font-bold leading-none">
                  {pendingCount}
                </span>
                Pending
              </Link>
            )}
            <Link href="/clubs/create"
              className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Create
            </Link>
          </div>
        </div>
      </div>

      <div className="-mt-10 space-y-5 pb-6">
        {/* Segment control */}
        <div className="mx-5">
          <div className="card-shadow flex rounded-full bg-white p-1">
            {(["joined", "explore"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 rounded-full py-2 text-sm font-semibold transition-colors"
                style={tab === t ? { backgroundColor: CLUBS_COLOR, color: "white" } : { color: "#6B7280" }}
              >
                {t === "joined" ? `Joined · ${joinedClubs.length}` : "Explore"}
              </button>
            ))}
          </div>
        </div>

        {tab === "joined" ? (
          <JoinedTab
            joinedClubs={joinedClubs}
            exploreClubs={exploreClubs}
            userId={userId}
            nextMeetingFor={nextMeetingFor}
            onJoin={joinClub}
            onExplore={() => setTab("explore")}
          />
        ) : (
          <ExploreTab
            clubs={filteredExplore}
            featured={featured}
            categories={CATEGORIES}
            selectedCategory={category}
            search={search}
            userId={userId}
            nextMeetingFor={nextMeetingFor}
            onSearch={setSearch}
            onCategory={setCategory}
            onJoin={joinClub}
          />
        )}
      </div>
    </div>
  );
}

function JoinedTab({ joinedClubs, exploreClubs, userId, nextMeetingFor, onJoin, onExplore }: {
  joinedClubs: Club[];
  exploreClubs: Club[];
  userId: string;
  nextMeetingFor: (id: string) => Meeting | undefined;
  onJoin: (id: string) => void;
  onExplore: () => void;
}) {
  const discover = exploreClubs.slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="space-y-3 px-5">
        {joinedClubs.length === 0 ? (
          <p className="text-sm text-gray-400">You haven't joined any clubs yet.</p>
        ) : (
          joinedClubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`}>
              <JoinedClubCard club={club} userId={userId} nextMeeting={nextMeetingFor(club.id)} />
            </Link>
          ))
        )}
      </div>

      {discover.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-5">
            <h2 className="font-semibold text-gray-900">Discover</h2>
            <button onClick={onExplore} className="text-xs font-semibold" style={{ color: CLUBS_COLOR }}>
              See all
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 scrollbar-none">
            {discover.map((club) => (
              <div key={club.id} className="w-48 shrink-0">
                <DiscoverCard club={club} nextMeeting={nextMeetingFor(club.id)} onJoin={() => onJoin(club.id)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExploreTab({ clubs, featured, categories, selectedCategory, search, userId, nextMeetingFor, onSearch, onCategory, onJoin }: {
  clubs: Club[];
  featured: Club | undefined;
  categories: ClubCategory[];
  selectedCategory: ClubCategory | null;
  search: string;
  userId: string;
  nextMeetingFor: (id: string) => Meeting | undefined;
  onSearch: (s: string) => void;
  onCategory: (c: ClubCategory | null) => void;
  onJoin: (id: string) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="mx-5 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 card-shadow">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
          placeholder="Search clubs"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto px-5 pb-1 scrollbar-none">
        {[null, ...categories].map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat ?? "all"}
              onClick={() => onCategory(cat)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors"
              style={active ? { backgroundColor: CLUBS_COLOR, color: "white" } : { backgroundColor: "white", color: "#374151" }}
            >
              {cat ?? "All"}
            </button>
          );
        })}
      </div>

      {/* Featured */}
      {featured && (
        <div className="space-y-2 px-5">
          <h2 className="font-semibold text-gray-900">Featured</h2>
          <Link href={`/clubs/${featured.id}`}>
            <FeaturedCard club={featured} nextMeeting={nextMeetingFor(featured.id)} onJoin={() => onJoin(featured.id)} />
          </Link>
        </div>
      )}

      {/* All clubs */}
      <div className="space-y-3 px-5">
        <h2 className="font-semibold text-gray-900">All clubs</h2>
        {clubs.length === 0 ? (
          <p className="text-sm text-gray-400">No clubs match your search.</p>
        ) : (
          clubs.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`} className="block">
              <ExploreCard club={club} nextMeeting={nextMeetingFor(club.id)} onJoin={() => onJoin(club.id)} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function JoinedClubCard({ club, userId, nextMeeting }: { club: Club; userId: string; nextMeeting: Meeting | undefined }) {
  const role = getRole(club, userId);
  const roleLabel = role === "admin" ? "Admin" : role === "officer" ? "Officer" : "Member";
  const dateStr = nextMeeting
    ? new Date(nextMeeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  return (
    <div className="card-shadow overflow-hidden rounded-[18px]">
      {/* Colored header */}
      <div className="flex items-center gap-2.5 px-4 py-3" style={{ backgroundColor: `#${club.color_hex}` }}>
        <ClubIcon colorHex={club.color_hex} size={32} />
        <span className="flex-1 font-semibold text-white">{club.name}</span>
        {role && (
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-[11px] font-semibold text-white">
            {roleLabel}
          </span>
        )}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </div>
      {/* White body */}
      <div className="bg-white px-4 py-3 space-y-1.5">
        {nextMeeting ? (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              {dateStr} · {nextMeeting.block} · Room {nextMeeting.room}
            </div>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "#D1486B18", color: "#D1486B" }}>
              {relativeDayLabel(nextMeeting.date)}
            </span>
          </div>
        ) : (
          <p className="text-xs text-gray-400">No upcoming meetings</p>
        )}
      </div>
    </div>
  );
}

function DiscoverCard({ club, nextMeeting, onJoin }: { club: Club; nextMeeting: Meeting | undefined; onJoin: () => void }) {
  return (
    <div className="card-shadow overflow-hidden rounded-[16px] bg-white">
      <div className="h-20 w-full flex items-center justify-center" style={{ backgroundColor: `#${club.color_hex}` }}>
        <ClubIcon colorHex={club.color_hex} size={40} />
      </div>
      <div className="p-3 space-y-2">
        <p className="font-semibold text-sm text-gray-900 leading-tight">{club.name}</p>
        {nextMeeting && (
          <p className="text-xs text-gray-400">{new Date(nextMeeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onJoin(); }}
          className="w-full rounded-full py-1.5 text-xs font-semibold text-white"
          style={{ backgroundColor: `#${club.color_hex}` }}
        >
          Join
        </button>
      </div>
    </div>
  );
}

function FeaturedCard({ club, nextMeeting, onJoin }: { club: Club; nextMeeting: Meeting | undefined; onJoin: () => void }) {
  return (
    <div className="card-shadow overflow-hidden rounded-[18px]" style={{ backgroundColor: `#${club.color_hex}` }}>
      <div className="p-5 text-white">
        <ClubIcon colorHex={club.color_hex} size={48} className="mb-3" />
        <h3 className="text-lg font-bold">{club.name}</h3>
        <p className="mt-1 text-sm opacity-80 line-clamp-2">{club.description}</p>
        {nextMeeting && (
          <p className="mt-2 text-xs opacity-70">
            Next: {new Date(nextMeeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
        <button
          onClick={(e) => { e.preventDefault(); onJoin(); }}
          className="mt-4 rounded-full bg-white px-5 py-2 text-sm font-semibold"
          style={{ color: `#${club.color_hex}` }}
        >
          Join
        </button>
      </div>
    </div>
  );
}

function ExploreCard({ club, nextMeeting, onJoin }: { club: Club; nextMeeting: Meeting | undefined; onJoin: () => void }) {
  return (
    <div className="card-shadow flex items-center gap-3 rounded-[16px] bg-white p-4">
      <ClubIcon colorHex={club.color_hex} size={44} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{club.name}</p>
        <p className="text-xs text-gray-400">{club.category}{nextMeeting ? ` · ${new Date(nextMeeting.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}</p>
      </div>
      <button
        onClick={(e) => { e.preventDefault(); onJoin(); }}
        className="shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white"
        style={{ backgroundColor: `#${club.color_hex}` }}
      >
        Join
      </button>
    </div>
  );
}
