"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Club, Meeting } from "@/types";
import { getRole, relativeDayLabel } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SCHEDULE_COLOR = "#3B5EA5";

function startOfWeek(date: Date, offset = 0): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + offset * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function SchedulePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rsvpOverrides, setRsvpOverrides] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserId(user.id);
      const [{ data: c }, { data: m }] = await Promise.all([
        supabase.from("clubs").select("*").eq("is_pending", false),
        supabase.from("meetings").select("*").order("date"),
      ]);
      setClubs((c ?? []) as Club[]);
      setMeetings((m ?? []) as Meeting[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200" style={{ borderTopColor: SCHEDULE_COLOR }} />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-3">Sign in to see your schedule.</p>
          <Link href="/login" className="rounded-full px-5 py-2 text-sm font-semibold text-white" style={{ backgroundColor: SCHEDULE_COLOR }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  const joinedClubIds = new Set(clubs.filter((c) => getRole(c, userId) !== null).map((c) => c.id));
  const myMeetings = meetings.filter((m) => joinedClubIds.has(m.club_id));

  const weekStart = startOfWeek(new Date(), weekOffset);
  const weekEnd = addDays(weekStart, 6);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const monthFmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekLabel = `${monthFmt(weekStart)} to ${monthFmt(weekEnd)}, ${weekEnd.getFullYear()}`;

  function meetingsOn(day: Date) {
    return myMeetings.filter((m) => sameDay(new Date(m.date), day));
  }

  const isCurrentWeek = weekOffset === 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Week stats
  const weekMeetingCount = weekDays.reduce((acc, d) => acc + meetingsOn(d).length, 0);
  const weekClubCount = new Set(weekDays.flatMap(d => meetingsOn(d).map(m => m.club_id))).size;
  const freeDaysCount = weekDays.filter(d => meetingsOn(d).length === 0).length;

  // "Got free time?" — clubs user hasn't joined with meetings on free days
  const freeDays = weekDays.filter(d => meetingsOn(d).length === 0);
  // One club suggestion per free day (clubs user hasn't joined)
  const freeDaySuggestions = freeDays.map(day => {
    const m = meetings.find(x => !joinedClubIds.has(x.club_id) && sameDay(new Date(x.date), day));
    if (!m) return null;
    const club = clubs.find(c => c.id === m.club_id);
    return club ? { club, meeting: m, day } : null;
  }).filter(Boolean) as { club: Club; meeting: Meeting; day: Date }[];

  function checkGoing(m: Meeting): boolean {
    if (rsvpOverrides.has(m.id)) return rsvpOverrides.get(m.id)!;
    return userId ? m.rsvp_user_ids.includes(userId) : false;
  }

  async function toggleRsvp(e: React.MouseEvent, meetingId: string, currentGoing: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setRsvpOverrides((prev) => new Map([...prev, [meetingId, !currentGoing]]));
    const supabase = createClient();
    await supabase.rpc("toggle_rsvp", { meeting_id: meetingId });
  }

  // Group days into "no meetings" spans and meeting days
  const groups: { days: Date[]; hasMeetings: boolean }[] = [];
  let buffer: Date[] = [];
  for (const day of weekDays) {
    const dm = meetingsOn(day);
    if (dm.length > 0) {
      if (buffer.length) { groups.push({ days: buffer, hasMeetings: false }); buffer = []; }
      groups.push({ days: [day], hasMeetings: true });
    } else {
      buffer.push(day);
    }
  }
  if (buffer.length) groups.push({ days: buffer, hasMeetings: false });

  return (
    <div className="min-h-dvh bg-[#F2F2F7]">
      {/* Header */}
      <div className="relative overflow-hidden px-6 pt-8 pb-10 md:px-8 rounded-b-[28px]"
        style={{ backgroundColor: SCHEDULE_COLOR, boxShadow: "0 8px 24px rgba(59,94,165,0.35), 0 2px 8px rgba(0,0,0,0.15)" }}>

        {/* Decorative bg circles */}
        <div className="absolute pointer-events-none" style={{ inset: 0, overflow: "hidden" }}>
          <div className="absolute pointer-events-none -right-10 -top-20 h-64 w-64 rounded-full border-[20px] border-white/15" />
          <div className="absolute pointer-events-none right-32 -top-8 h-64 w-64 rounded-full border-[20px] border-white/10" />
          <div className="absolute pointer-events-none right-12 -bottom-24 h-64 w-64 rounded-full border-[20px] border-white/7" />
          <div className="absolute pointer-events-none -right-24 top-2 h-64 w-64 rounded-full border-[20px] border-white/5" />
        </div>

        <div className="relative flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">My Schedule</h1>
            <p className="mt-1 text-sm text-white/70">
              {weekMeetingCount > 0
                ? `${weekMeetingCount} meeting${weekMeetingCount !== 1 ? "s" : ""} this week.${myMeetings[0] ? ` The next one is ${relativeDayLabel(myMeetings[0].date).toLowerCase()}.` : ""}`
                : "No meetings this week."}
            </p>
          </div>
          {/* Week nav */}
          <div className="flex items-center gap-2">
            {!isCurrentWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="rounded-full px-3 py-1 text-xs font-bold text-white"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.25)" }}>
                Today
              </button>
            )}
            <div className="flex items-center gap-1 rounded-full px-2 py-1.5"
              style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <button
                onClick={() => setWeekOffset(w => w - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <ChevronLeft size={15} className="text-white" />
              </button>
              <span className="text-sm font-semibold text-white whitespace-nowrap px-1">{weekLabel}</span>
              <button
                onClick={() => setWeekOffset(w => w + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <ChevronRight size={15} className="text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Day strip — glassmorphism cards */}
        <div className="relative grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const dayMeetings = meetingsOn(day);
            const clubsOnDay = dayMeetings.map(m => clubs.find(c => c.id === m.club_id)).filter(Boolean) as typeof clubs;
            const isToday = sameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl py-3 h-[84px]"
                style={isToday ? {
                  background: "rgba(255,255,255,0.95)",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.18), 0 1px 6px rgba(0,0,0,0.12)",
                } : {
                  background: "rgba(255,255,255,0.10)",
                  backdropFilter: "blur(10px)",
                  border: "1.5px solid rgba(255,255,255,0.18)",
                }}>
                <span className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ color: isToday ? SCHEDULE_COLOR : "rgba(255,255,255,0.6)" }}>
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-2xl font-black leading-none"
                  style={{ color: isToday ? SCHEDULE_COLOR : "white" }}>
                  {day.getDate()}
                </span>
                {isToday ? (
                  <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: SCHEDULE_COLOR, opacity: 0.55 }}>
                    TODAY
                  </span>
                ) : clubsOnDay.length > 0 ? (
                  <div className="flex gap-[3px] items-center mt-0.5">
                    {clubsOnDay.slice(0, 3).map((club, i) => (
                      <div key={i} className="h-[7px] w-[7px] rounded-full"
                        style={{ backgroundColor: `#${club!.color_hex}`, boxShadow: `0 0 4px #${club!.color_hex}88` }} />
                    ))}
                  </div>
                ) : (
                  <div className="h-[7px]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column body */}
      <div className="px-5 py-6 md:px-8 lg:grid lg:grid-cols-[1fr_260px] lg:gap-6 lg:items-start">
        {/* This week */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">This week</h2>
            {freeDaysCount > 0 && (
              <Link href="/clubs" className="text-xs font-semibold" style={{ color: SCHEDULE_COLOR }}>
                Fill a free day →
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-8">
            {groups.map((group, gi) => {
              if (!group.hasMeetings) {
                const first = group.days[0];
                const last = group.days[group.days.length - 1];
                const span = group.days.length === 1
                  ? first.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                  : `${first.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} – ${last.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
                return (
                  <p key={gi} className="text-sm text-gray-400 py-1 px-1">{span} · No meetings</p>
                );
              }
              const day = group.days[0];
              const dayMeetings = meetingsOn(day);
              const dayAbbr = day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dayNum = day.getDate();
              return (
                <div key={gi} className="flex gap-5">
                  <div className="flex flex-col items-center w-10 shrink-0 pt-4">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider">{dayAbbr}</span>
                    <span className="text-2xl font-black text-gray-800 leading-none">{dayNum}</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-4">
                    {dayMeetings.map((m) => {
                      const club = clubs.find((c) => c.id === m.club_id);
                      if (!club) return null;
                      const role = getRole(club, userId);
                      const going = checkGoing(m);
                      const label = relativeDayLabel(m.date);
                      return (
                        <Link key={m.id} href={`/clubs/${club.id}`} className="block">
                          <div className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4" style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.08)" }}>
                            <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={44} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-gray-900 text-base">{club.name}</p>
                                {(role === "officer" || role === "admin") && (
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                    style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                                    Officer
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mt-0.5">{m.block} · Room {m.room} · {m.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {m.rsvp_user_ids.length > 0 ? `${m.rsvp_user_ids.length} going` : "Be the first to join"} · <span className="font-medium" style={{ color: SCHEDULE_COLOR }}>{label}</span>
                              </p>
                            </div>
                            <button
                              onClick={(e) => toggleRsvp(e, m.id, going)}
                              className="shrink-0 rounded-full px-4 py-2 text-sm font-bold cursor-pointer transition-all hover:opacity-80"
                              style={going
                                ? { backgroundColor: "#1C1C1E", color: "white" }
                                : { backgroundColor: "#E7E7EC", color: "#374151" }}>
                              {going ? "I'm in ✓" : "RSVP"}
                            </button>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Week summary */}
        <div className="mt-6 lg:mt-0 space-y-4">
          <div className="rounded-2xl bg-white overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900 text-sm">Week summary</h2>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-100">
              {[
                { value: weekMeetingCount, label: "Meetings" },
                { value: weekClubCount, label: "Clubs" },
                { value: freeDaysCount, label: "Free days" },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-4">
                  <p className="text-2xl font-black text-gray-900">{s.value}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {freeDaySuggestions.length > 0 && (
            <div className="rounded-2xl bg-white overflow-hidden">
              <div className="px-4 pt-4 pb-3 border-b border-gray-100">
                <p className="font-bold text-gray-900 text-sm">Got free time?</p>
                <p className="text-xs text-gray-400 mt-0.5">Clubs meeting on your open days.</p>
              </div>
              <div className="divide-y divide-gray-50">
                {freeDaySuggestions.map(({ club, day }) => {
                  const dayName = day.toLocaleDateString("en-US", { weekday: "long" });
                  const dayDate = day.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                  return (
                    <Link key={`${club.id}-${day.toISOString()}`} href={`/clubs/${club.id}`} className="block">
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `#${club.color_hex}` }}>
                          <div className="h-3.5 w-3.5 rounded-full bg-white/40" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{club.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{dayName} · {dayDate}</p>
                        </div>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
