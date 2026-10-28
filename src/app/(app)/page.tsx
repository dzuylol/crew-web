import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Club, Meeting, Announcement, AppUser } from "@/types";
import { getRole, relativeDayLabel, stableColor, displayName, allMemberCount } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

const PRIMARY = "#7A1F2E";

export default async function HomePage() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date().toISOString();
  const [{ data: allClubs }, { data: upcomingMeetings }] = await Promise.all([
    supabase.from("clubs").select("*").eq("is_pending", false).order("name"),
    supabase.from("meetings").select("*").gte("date", now).order("date").limit(20),
  ]);

  const clubs = (allClubs ?? []) as Club[];
  const meetings = (upcomingMeetings ?? []) as Meeting[];

  if (!user) {
    return <PublicHome clubs={clubs} meetings={meetings} />;
  }

  const [{ data: profileData }, { data: announcementsData }] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("announcements").select("*").order("date", { ascending: false }).limit(10),
  ]);

  const profile = profileData as AppUser | null;
  const announcements = (announcementsData ?? []) as Announcement[];

  const myClubs = clubs.filter((c) => getRole(c, user.id) !== null);
  const myMeetings = meetings.filter((m) => myClubs.some((c) => c.id === m.club_id));
  const myAnnouncements = announcements.filter((a) => myClubs.some((c) => c.id === a.club_id));

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  const weekMeetings = myMeetings.filter((m) => {
    const d = new Date(m.date);
    return d >= today && d <= nextWeek;
  });

  const nextMeeting = myMeetings[0];
  const nextClub = nextMeeting ? clubs.find((c) => c.id === nextMeeting.club_id) : null;
  const daysUntil = nextMeeting
    ? Math.max(0, Math.ceil((new Date(nextMeeting.date).getTime() - Date.now()) / 86400000))
    : null;

  const discoverClubs = clubs.filter((c) => getRole(c, user.id) === null);

  return (
    <div className="min-h-dvh bg-[#F2F2F7]">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[28px] px-6 pt-8 pb-10 md:px-8 md:pt-10" style={{ backgroundColor: PRIMARY }}>
        <div className="pointer-events-none absolute right-[-20px] top-1/2 -translate-y-1/2 w-[40%] select-none opacity-30">
          <Image src="/wildcat.webp" alt="" width={600} height={275} className="w-full h-auto" />
        </div>
        <div className="relative max-w-2xl">
          <p className="text-xs font-semibold tracking-wider text-white/50 uppercase mb-1">
            {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-3xl font-black text-white md:text-4xl">
            Welcome back, {profile?.first_name ?? "there"}
          </h1>
          <p className="mt-2 text-sm text-white/70">
            {weekMeetings.length > 0
              ? `You have ${weekMeetings.length} meeting${weekMeetings.length !== 1 ? "s" : ""}${nextClub ? ` and ${myAnnouncements.length} new alert${myAnnouncements.length !== 1 ? "s" : ""}` : ""} this week.${nextClub ? ` ${nextClub.name} is up next.` : ""}`
              : "No meetings this week. Check out new clubs!"}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/schedule"
              className="rounded-full bg-white px-5 py-2 text-sm font-bold"
              style={{ color: PRIMARY }}>
              View my schedule →
            </Link>
            <Link href="/clubs"
              className="rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white">
              Explore clubs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 px-5 py-4 md:px-8">
        <StatCard
          icon={<CalIcon />}
          value={String(weekMeetings.length)}
          label="Meetings this week"
          accent={weekMeetings.length > 0}
        />
        <StatCard
          icon={<BellIcon />}
          value={String(myAnnouncements.length)}
          label="New alerts"
          accent={myAnnouncements.length > 0}
        />
        <StatCard
          icon={nextClub ? <ClubIcon colorHex={nextClub.color_hex} iconName={nextClub.icon_name} size={16} /> : <ClockIcon />}
          value={daysUntil !== null ? `${daysUntil}d` : "—"}
          label={nextClub ? `Until ${nextClub.name}` : "No upcoming"}
          accent={daysUntil !== null && daysUntil <= 2}
        />
      </div>

      {/* Two-column layout */}
      <div className="px-5 pb-10 md:px-8 md:grid md:grid-cols-[1fr_340px] md:gap-6 md:items-start">
        {/* Left: Schedule at a glance */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-gray-900">Schedule at a glance</h2>
            <Link href="/schedule" className="text-xs font-semibold" style={{ color: PRIMARY }}>See full week →</Link>
          </div>
          {myMeetings.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center">
              <p className="text-sm text-gray-400">No upcoming meetings.</p>
              <Link href="/clubs" className="mt-2 inline-block text-sm font-semibold" style={{ color: PRIMARY }}>Find clubs →</Link>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {myMeetings.slice(0, 4).map((m) => {
                const club = clubs.find((c) => c.id === m.club_id);
                if (!club) return null;
                return <ScheduleCard key={m.id} meeting={m} club={club} userId={user.id} />;
              })}
            </div>
          )}
        </div>

        {/* Right: Announcements + Discover */}
        <div className="mt-6 md:mt-0 space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 mb-3">Announcements</h2>
            {myAnnouncements.length === 0 ? (
              <div className="rounded-2xl bg-white p-5">
                <p className="text-sm text-gray-400">You&apos;re all caught up.</p>
              </div>
            ) : (
              <div className="rounded-2xl bg-white overflow-hidden divide-y divide-gray-100">
                {myAnnouncements.slice(0, 5).map((a) => {
                  const club = clubs.find((c) => c.id === a.club_id);
                  return (
                    <div key={a.id} className="p-4">
                      {club && (
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: `#${club.color_hex}` }} />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            {club.name} · NEW
                          </span>
                        </div>
                      )}
                      <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                      {a.body && <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{a.body}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {discoverClubs.length > 0 && (
            <Link href="/clubs"
              className="block rounded-2xl p-5 text-white"
              style={{ backgroundColor: "#8470C8" }}>
              <p className="font-bold text-base">Find your next club</p>
              <p className="mt-1 text-sm text-white/80">
                {discoverClubs.length > 0 && discoverClubs[0]
                  ? `${discoverClubs[0].name} meets ${nextMeetingStr(meetings, discoverClubs[0].id)}.`
                  : `${discoverClubs.length} clubs to explore at Plano.`}
              </p>
              <span className="mt-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold">
                Explore clubs
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function nextMeetingStr(meetings: Meeting[], clubId: string): string {
  const m = meetings.find((x) => x.club_id === clubId);
  if (!m) return "soon";
  const d = new Date(m.date);
  return `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} · ${m.block}`;
}

function PublicHome({ clubs, meetings }: { clubs: Club[]; meetings: Meeting[] }) {
  return (
    <div className="min-h-dvh bg-[#F2F2F7]">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[28px] px-6 pt-12 pb-16 md:px-10 md:pt-16" style={{ backgroundColor: PRIMARY }}>
        <div className="pointer-events-none absolute right-[-40px] top-1/2 -translate-y-1/2 w-[55%] select-none opacity-30">
          <Image src="/wildcat.webp" alt="" width={600} height={275} className="w-full h-auto" />
        </div>
        <div className="relative max-w-xl">
          <div className="mb-4 flex items-center gap-2">
            <Image src="/paw-logo.png" alt="Crew" width={28} height={28} className="rounded-md opacity-80" />
            <span className="text-sm font-bold tracking-widest text-white/70 uppercase">Crew</span>
          </div>
          <h1 className="text-4xl font-black text-white leading-tight md:text-5xl">
            Your clubs.<br />One place.
          </h1>
          <p className="mt-3 text-base text-white/70">
            Meetings and updates for every Plano Senior High club, all in one hub.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/clubs"
              className="rounded-full bg-white px-8 py-3 text-sm font-bold"
              style={{ color: PRIMARY }}>
              Browse clubs →
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 px-5 py-5 md:px-8">
        <div className="rounded-2xl bg-white px-4 py-4">
          <p className="text-2xl font-black" style={{ color: PRIMARY }}>{clubs.length}</p>
          <p className="mt-0.5 text-xs text-gray-500">Active clubs</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-4">
          <p className="text-2xl font-black" style={{ color: PRIMARY }}>{meetings.length}</p>
          <p className="mt-0.5 text-xs text-gray-500">Upcoming meetings</p>
        </div>
      </div>

      {/* Club grid */}
      <div className="px-5 pb-8 md:px-8">
        <div className="mb-4">
          <h2 className="font-bold text-gray-900 text-lg">All clubs</h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {clubs.slice(0, 6).map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 hover:shadow-md transition-shadow">
              <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={44} />
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{club.name}</p>
                <p className="text-xs text-gray-400">{club.category} · {allMemberCount(club)} members</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 rounded-2xl p-8 text-center" style={{ backgroundColor: PRIMARY }}>
          <p className="text-white font-bold text-xl">Ready to join?</p>
          <p className="text-white/70 text-sm mt-2">Sign in with your Google account to RSVP, get announcements, and more.</p>
          <Link href="/login"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-base font-bold shadow-lg"
            style={{ color: PRIMARY }}>
            Sign in with Google
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string; label: string; accent: boolean }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-3 flex items-start gap-2.5 shadow-sm">
      <div className="mt-0.5 rounded-lg p-1.5 shrink-0"
        style={{ backgroundColor: accent ? `${PRIMARY}18` : "#F3F4F6" }}>
        <div style={{ color: accent ? PRIMARY : "#9CA3AF" }}>{icon}</div>
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black leading-none" style={{ color: accent ? PRIMARY : "#111827" }}>{value}</p>
        <p className="mt-0.5 text-[10px] text-gray-400 leading-tight">{label}</p>
      </div>
    </div>
  );
}

function ScheduleCard({ meeting, club, userId }: { meeting: Meeting; club: Club; userId: string }) {
  const d = new Date(meeting.date);
  const dayAbbr = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dateStr = `${dayAbbr} · ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()} · ${meeting.block}`;
  const label = relativeDayLabel(meeting.date);
  const isGoing = meeting.rsvp_user_ids.includes(userId);

  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2 mb-3">
        <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={40} />
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
          style={{ backgroundColor: `${PRIMARY}18`, color: PRIMARY }}>
          {label}
        </span>
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{dateStr}</p>
      <p className="mt-0.5 font-bold text-gray-900">{club.name}</p>
      <p className="text-xs text-gray-500 mt-0.5">Room {meeting.room} · {meeting.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-400">{meeting.rsvp_user_ids.length} going</p>
        <span className="rounded-full px-3 py-1 text-xs font-semibold"
          style={isGoing
            ? { backgroundColor: "#1C1C1E", color: "white" }
            : { backgroundColor: "#F3F4F6", color: "#6B7280" }}>
          {isGoing ? "I'm in ✓" : "I'm in"}
        </span>
      </div>
    </div>
  );
}

function CalIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
}
function BellIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
function ClockIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
}
