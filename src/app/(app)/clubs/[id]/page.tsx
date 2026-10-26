import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Club, Meeting, Announcement } from "@/types";
import { getRole, canManage, allMemberCount, relativeDayLabel } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";
import JoinLeaveButton from "./JoinLeaveButton";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const [{ data: clubData }, { data: meetingsData }, { data: announcementsData }] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", id).single(),
    supabase.from("meetings").select("*").eq("club_id", id).order("date"),
    supabase.from("announcements").select("*").eq("club_id", id).order("date", { ascending: false }),
  ]);

  if (!clubData) notFound();

  const club = clubData as Club;
  const meetings = (meetingsData ?? []) as Meeting[];
  const announcements = (announcementsData ?? []) as Announcement[];

  const role = getRole(club, user.id);
  const manage = canManage(club, user.id);
  const memberCount = allMemberCount(club);

  const now = new Date().toISOString();
  const upcomingMeetings = meetings.filter((m) => m.date >= now);
  const nextMeeting = upcomingMeetings[0];

  const roleLabel = role === "admin" ? "Admin" : role === "officer" ? "Officer" : "Member";

  return (
    <div className="min-h-dvh">
      {/* Crescent header */}
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: `#${club.color_hex}` }}>
        <div className="flex items-start gap-3">
          <Link href="/clubs" className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{club.name}</h1>
            <p className="mt-1 text-sm opacity-80 line-clamp-2">{club.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>{memberCount} members</Pill>
              <Pill>{club.meeting_frequency}</Pill>
              {role && <Pill>{roleLabel} ✓</Pill>}
            </div>
          </div>
        </div>
      </div>

      <div className="-mt-10 space-y-5 px-5 pb-8">
        {/* Join/Leave action */}
        <JoinLeaveButton club={club} userId={user.id} role={role} />

        {/* Next meeting */}
        <Section title="Next meeting">
          {nextMeeting ? (
            <MeetingCard meeting={nextMeeting} club={club} showRSVP userId={user.id} />
          ) : (
            <p className="text-sm text-gray-400">No upcoming meetings.</p>
          )}
        </Section>

        {/* All meetings (officers only) */}
        {manage && upcomingMeetings.length > 1 && (
          <Section title={`All meetings (${upcomingMeetings.length})`}>
            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} club={club} showRSVP={false} userId={user.id} />
              ))}
            </div>
          </Section>
        )}

        {/* Announcements */}
        <Section title="Announcements">
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} club={club} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">
      {children}
    </span>
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

function MeetingCard({ meeting, club, showRSVP, userId }: {
  meeting: Meeting;
  club: Club;
  showRSVP: boolean;
  userId: string;
}) {
  const d = new Date(meeting.date);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const day = d.getDate();
  const isGoing = meeting.rsvp_user_ids.includes(userId);

  return (
    <div className="card-shadow flex items-start gap-3 rounded-[18px] bg-white p-4">
      <div className="flex w-12 flex-col items-center justify-center rounded-xl py-2 text-white" style={{ backgroundColor: `#${club.color_hex}` }}>
        <span className="text-[10px] font-bold">{weekday}</span>
        <span className="text-lg font-bold leading-none">{day}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900">{meeting.title}</p>
        <p className="mt-0.5 text-xs text-gray-500">{meeting.block} · Room {meeting.room}</p>
        {meeting.description && (
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{meeting.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-400">{meeting.rsvp_user_ids.length} going</p>
      </div>
      {showRSVP && (
        <span
          className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={isGoing
            ? { backgroundColor: `#${club.color_hex}`, color: "white" }
            : { backgroundColor: "#E7E7EC", color: "#374151" }
          }
        >
          {isGoing ? "I'm in ✓" : "I'm in"}
        </span>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement, club }: { announcement: Announcement; club: Club }) {
  const dateStr = new Date(announcement.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="card-shadow rounded-[16px] bg-white p-4">
      <div className="flex items-center justify-between">
        {!announcement.is_read && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `#${club.color_hex}22`, color: `#${club.color_hex}` }}>
            NEW
          </span>
        )}
        <span className="ml-auto text-xs text-gray-400">{dateStr}</span>
      </div>
      <p className="mt-2 font-semibold text-gray-900">{announcement.title}</p>
      <p className="mt-1 text-sm text-gray-500">{announcement.body}</p>
    </div>
  );
}
