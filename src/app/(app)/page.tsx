import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Club, Meeting, Announcement, AppUser } from "@/types";
import { getRole, daysFromNow, relativeDayLabel, stableColor } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

const HOME_COLOR = "#7A1F2E";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: clubs }, { data: meetings }, { data: announcements }] =
    await Promise.all([
      supabase.from("users").select("*").eq("id", user.id).single(),
      supabase.from("clubs").select("*").eq("is_pending", false),
      supabase.from("meetings").select("*").gte("date", new Date().toISOString()).order("date"),
      supabase.from("announcements").select("*").order("date", { ascending: false }),
    ]);

  const appUser = profile as AppUser | null;
  const allClubs = (clubs ?? []) as Club[];
  const allMeetings = (meetings ?? []) as Meeting[];
  const allAnnouncements = (announcements ?? []) as Announcement[];

  const joinedClubs = allClubs.filter((c) => getRole(c, user.id) !== null);
  const joinedClubIds = new Set(joinedClubs.map((c) => c.id));

  const upcomingMeetings = allMeetings
    .filter((m) => joinedClubIds.has(m.club_id))
    .slice(0, 5);

  const unreadAnnouncements = allAnnouncements
    .filter((a) => joinedClubIds.has(a.club_id))
    .slice(0, 5);

  const nextMeeting = upcomingMeetings[0];
  const nextClub = nextMeeting ? allClubs.find((c) => c.id === nextMeeting.club_id) : null;
  const daysUntilNext = nextMeeting ? daysFromNow(nextMeeting.date) : null;

  const firstName = appUser?.first_name || user.email?.split("@")[0] || "there";

  function clubFor(clubId: string) {
    return allClubs.find((c) => c.id === clubId);
  }

  return (
    <div className="min-h-dvh">
      {/* Crescent header */}
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: HOME_COLOR }}>
        <div className="flex items-start justify-between">
          <h1 className="text-2xl font-bold">Welcome back, {firstName}</h1>
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: stableColor(user.id) }}
          >
            {firstName[0].toUpperCase()}
          </Link>
        </div>
      </div>

      <div className="-mt-10 space-y-6 px-5 pb-6">
        {/* Stats card */}
        <div className="card-shadow flex divide-x divide-gray-100 overflow-hidden rounded-[18px] bg-white">
          <StatTile value={upcomingMeetings.length} label="Meetings" />
          <StatTile value={unreadAnnouncements.length} label="Alerts" accent="#E0922B" />
          {daysUntilNext !== null && nextClub ? (
            <StatTile value={`${daysUntilNext}d`} label={`Until ${nextClub.name}`} accent="#D1486B" />
          ) : (
            <StatTile value="–" label="Next meeting" />
          )}
        </div>

        {/* Upcoming meetings */}
        <Section title="Schedule at a glance">
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400">No meetings this week.</p>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => {
                const club = clubFor(m.club_id);
                if (!club) return null;
                return (
                  <Link key={m.id} href={`/clubs/${club.id}`}>
                    <MeetingPreviewCard meeting={m} club={club} />
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        {/* Announcements */}
        <Section title="Announcements at a glance">
          {unreadAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400">You're all caught up.</p>
          ) : (
            <div className="space-y-3">
              {unreadAnnouncements.map((a) => {
                const club = clubFor(a.club_id);
                if (!club) return null;
                return (
                  <Link key={a.id} href={`/clubs/${club.id}`}>
                    <AnnouncementCard announcement={a} club={club} />
                  </Link>
                );
              })}
            </div>
          )}
        </Section>

        {/* Join first club CTA */}
        {joinedClubs.length === 0 && (
          <div className="card-shadow rounded-[18px] bg-white p-5">
            <p className="font-semibold text-gray-900">Join your first club</p>
            <p className="mt-1 text-sm text-gray-500">Explore what's out there and find a club that fits.</p>
            <Link
              href="/clubs"
              className="mt-3 inline-block rounded-full px-4 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: HOME_COLOR }}
            >
              Explore clubs
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatTile({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center py-4">
      <span className="text-xl font-bold" style={{ color: accent ?? "#111111" }}>
        {value}
      </span>
      <span className="mt-0.5 text-center text-xs text-gray-500">{label}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

function MeetingPreviewCard({ meeting, club }: { meeting: Meeting; club: Club }) {
  const d = new Date(meeting.date);
  const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const label = relativeDayLabel(meeting.date);

  return (
    <div className="card-shadow flex items-start gap-3 rounded-[16px] bg-white p-4">
      <ClubIcon colorHex={club.color_hex} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-400">{dateStr} · {meeting.block}</span>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: "#D1486B18", color: "#D1486B" }}>
            {label}
          </span>
        </div>
        <p className="mt-1 font-semibold text-gray-900 leading-tight">{meeting.title}</p>
        <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">Room {meeting.room} · {meeting.description}</p>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, club }: { announcement: Announcement; club: Club }) {
  return (
    <div className="card-shadow rounded-[16px] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClubIcon colorHex={club.color_hex} size={28} />
          <span className="text-xs font-semibold text-gray-500">{club.name}</span>
        </div>
        <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `#${club.color_hex}22`, color: `#${club.color_hex}` }}>
          NEW
        </span>
      </div>
      <p className="mt-2 font-semibold text-gray-900">{announcement.title}</p>
      <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{announcement.body}</p>
    </div>
  );
}
