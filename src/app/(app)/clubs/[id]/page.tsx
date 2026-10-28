import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Club, Meeting, Announcement, AppUser } from "@/types";
import { getRole, canManage, isClubAdmin, allMemberCount, relativeDayLabel } from "@/types";
import JoinLeaveButton from "./JoinLeaveButton";
import RsvpSection from "./RsvpSection";
import AddMeetingButton from "./AddMeetingButton";
import AddAnnouncementButton from "./AddAnnouncementButton";
import RosterSection from "./RosterSection";
import DeleteAnnouncementButton from "./DeleteAnnouncementButton";
import DeleteMeetingButton from "./DeleteMeetingButton";
import DeleteClubButton from "./DeleteClubButton";
import EditMeetingButton from "./EditMeetingButton";
import EditAnnouncementButton from "./EditAnnouncementButton";

export default async function ClubDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const [
    { data: clubData },
    { data: meetingsData },
    { data: announcementsData },
    { data: profileData },
  ] = await Promise.all([
    supabase.from("clubs").select("*").eq("id", id).single(),
    supabase.from("meetings").select("*").eq("club_id", id).order("date"),
    supabase.from("announcements").select("*").eq("club_id", id).order("date", { ascending: false }),
    supabase.from("users").select("*").eq("id", user.id).single(),
  ]);

  if (!clubData) notFound();

  const club = clubData as Club;
  const meetings = (meetingsData ?? []) as Meeting[];
  const announcements = (announcementsData ?? []) as Announcement[];
  const profile = profileData as AppUser | null;
  const isSuperAdmin = profile?.is_super_admin ?? false;

  // Fetch roster
  const rosterIds = [...new Set([club.admin_id, ...club.officer_ids, ...club.member_ids])];
  const { data: rosterData } = await supabase.from("users").select("*").in("id", rosterIds);
  const roster = (rosterData ?? []) as AppUser[];

  // Fetch attendee profiles for meetings (all unique RSVP user IDs)
  const allRsvpIds = [...new Set(meetings.flatMap((m) => m.rsvp_user_ids))];
  const { data: attendeeData } = allRsvpIds.length > 0
    ? await supabase.from("users").select("id, first_name, last_name").in("id", allRsvpIds)
    : { data: [] };
  const attendeeProfiles = (attendeeData ?? []) as { id: string; first_name: string; last_name: string }[];

  const role = getRole(club, user.id);
  const manage = canManage(club, user.id, isSuperAdmin);
  const admin = isClubAdmin(club, user.id, isSuperAdmin);
  const memberCount = allMemberCount(club);

  const now = new Date().toISOString();
  const upcomingMeetings = meetings.filter((m) => m.date >= now);
  const pastMeetings = meetings.filter((m) => m.date < now);

  const roleLabel = role === "admin" ? "Admin" : role === "officer" ? "Officer" : "Member";

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      {/* Crescent header */}
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: `#${club.color_hex}` }}>
        <div className="flex items-start gap-3">
          <Link href="/clubs" className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
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
              <Pill>{club.category}</Pill>
              {role && <Pill>{roleLabel} ✓</Pill>}
            </div>
            {isSuperAdmin && (
              <div className="mt-3">
                <DeleteClubButton clubId={club.id} clubName={club.name} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="-mt-10 space-y-5 px-5 pb-8">
        {/* Join/Leave */}
        {!isSuperAdmin && <JoinLeaveButton club={club} userId={user.id} role={role} />}

        {/* Officer/Admin actions */}
        {manage && (
          <div id="post" className="space-y-2">
            <AddMeetingButton clubId={club.id} colorHex={club.color_hex} />
            <AddAnnouncementButton clubId={club.id} colorHex={club.color_hex} />
          </div>
        )}

        {/* Upcoming meetings */}
        <Section title={`Upcoming meetings (${upcomingMeetings.length})`}>
          {upcomingMeetings.length === 0 ? (
            <p className="text-sm text-gray-400">No upcoming meetings.</p>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <MeetingCard key={m.id} meeting={m} club={club} userId={user.id} canDelete={manage} attendeeProfiles={attendeeProfiles} />
              ))}
            </div>
          )}
        </Section>

        {/* Announcements */}
        <Section title="Announcements">
          {announcements.length === 0 ? (
            <p className="text-sm text-gray-400">No announcements yet.</p>
          ) : (
            <div className="space-y-3">
              {announcements.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} club={club} canDelete={manage} />
              ))}
            </div>
          )}
        </Section>

        {/* Roster */}
        <Section title={`Roster (${rosterIds.length})`}>
          <RosterSection club={club} members={roster} currentUserId={user.id} isAdmin={admin} />
        </Section>

        {/* Past meetings (collapsed) */}
        {pastMeetings.length > 0 && (
          <Section title={`Past meetings (${pastMeetings.length})`}>
            <div className="space-y-3">
              {pastMeetings.slice(0, 3).map((m) => (
                <MeetingCard key={m.id} meeting={m} club={club} userId={user.id} canDelete={manage} attendeeProfiles={attendeeProfiles} past />
              ))}
            </div>
          </Section>
        )}
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

function MeetingCard({ meeting, club, userId, canDelete, attendeeProfiles, past }: {
  meeting: Meeting; club: Club; userId: string; canDelete: boolean;
  attendeeProfiles: { id: string; first_name: string; last_name: string }[];
  past?: boolean;
}) {
  const d = new Date(meeting.date);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const day = d.getDate();

  return (
    <div className={`card-shadow rounded-[18px] bg-white p-4 ${past ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-3">
        <div className="flex w-12 shrink-0 flex-col items-center justify-center rounded-xl py-2 text-white"
          style={{ backgroundColor: `#${club.color_hex}` }}>
          <span className="text-[10px] font-bold">{weekday}</span>
          <span className="text-lg font-bold leading-none">{day}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900">{meeting.title}</p>
            <div className="flex items-center gap-0.5 shrink-0">
              {!past && <span className="text-xs text-gray-400 mr-1">{relativeDayLabel(meeting.date)}</span>}
              {canDelete && !past && <EditMeetingButton meeting={meeting} colorHex={club.color_hex} />}
              {canDelete && <DeleteMeetingButton meetingId={meeting.id} />}
            </div>
          </div>
          <p className="mt-0.5 text-xs text-gray-500">{meeting.block}{meeting.room ? ` · Room ${meeting.room}` : ""}</p>
          {meeting.description && <p className="mt-1 text-sm text-gray-600 line-clamp-2">{meeting.description}</p>}
        </div>
      </div>
      {!past && (
        <RsvpSection
          meetingId={meeting.id}
          initialIds={meeting.rsvp_user_ids}
          userId={userId}
          colorHex={club.color_hex}
          attendeeProfiles={attendeeProfiles}
        />
      )}
      {past && meeting.rsvp_user_ids.length > 0 && (
        <p className="mt-1 text-xs text-gray-400">{meeting.rsvp_user_ids.length} attended</p>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement, club, canDelete }: {
  announcement: Announcement; club: Club; canDelete: boolean;
}) {
  const dateStr = new Date(announcement.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="card-shadow rounded-[16px] bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-gray-900">{announcement.title}</p>
        <div className="flex items-center gap-0.5 shrink-0">
          <span className="text-xs text-gray-400 mr-1">{dateStr}</span>
          {canDelete && <EditAnnouncementButton announcement={announcement} colorHex={club.color_hex} />}
          {canDelete && <DeleteAnnouncementButton announcementId={announcement.id} />}
        </div>
      </div>
      {announcement.body && <p className="mt-1 text-sm text-gray-500">{announcement.body}</p>}
    </div>
  );
}
