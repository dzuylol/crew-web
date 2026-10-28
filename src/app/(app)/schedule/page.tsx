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
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

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
  const freeDaySuggestions = clubs
    .filter((c) => !joinedClubIds.has(c.id))
    .map((c) => {
      const m = meetings.find(x => x.club_id === c.id && freeDays.some(d => sameDay(new Date(x.date), d)));
      return m ? { club: c, meeting: m } : null;
    })
    .filter(Boolean)
    .slice(0, 2) as { club: Club; meeting: Meeting }[];

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
      <div className="px-6 pt-8 pb-10 md:px-8 rounded-b-[28px]"
        style={{ backgroundColor: SCHEDULE_COLOR, boxShadow: "0 8px 24px rgba(59,94,165,0.35), 0 2px 8px rgba(0,0,0,0.15)" }}>
        <div className="flex items-end justify-between gap-4 mb-6">
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
                className="rounded-full bg-white px-3 py-1 text-xs font-bold"
                style={{ color: SCHEDULE_COLOR }}>
                Today
              </button>
            )}
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <ChevronLeft size={16} className="text-white" />
            </button>
            <span className="text-sm font-semibold text-white whitespace-nowrap">{weekLabel}</span>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
              <ChevronRight size={16} className="text-white" />
            </button>
          </div>
        </div>

        {/* Day strip */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((day) => {
            const hasMeeting = meetingsOn(day).length > 0;
            const isSelected = sameDay(day, selectedDay);
            const isToday = sameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-2.5 transition-colors h-[68px]"
                style={isSelected ? { backgroundColor: "rgba(255,255,255,0.2)" } : undefined}>
                <span className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: isSelected ? "white" : "rgba(255,255,255,0.5)" }}>
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </span>
                <span className="text-base font-black leading-none"
                  style={{ color: isSelected || isToday ? "white" : "rgba(255,255,255,0.7)" }}>
                  {day.getDate()}
                </span>
                {isToday ? (
                  <span className="text-[9px] font-bold uppercase tracking-wider"
                    style={{ color: isSelected ? "white" : "rgba(255,255,255,0.5)" }}>
                    TODAY
                  </span>
                ) : (
                  <div className="h-1 w-1 rounded-full"
                    style={{ backgroundColor: hasMeeting ? "white" : "transparent" }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-column body */}
      <div className="px-5 py-6 md:px-8 md:grid md:grid-cols-[1fr_280px] md:gap-6 md:items-start">
        {/* This week */}
        <div>
          <h2 className="font-bold text-gray-900 mb-4">This week</h2>
          <div className="space-y-2">
            {groups.map((group, gi) => {
              if (!group.hasMeetings) {
                const first = group.days[0];
                const last = group.days[group.days.length - 1];
                const span = group.days.length === 1
                  ? `${first.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`
                  : `${first.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} to ${last.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`;
                return (
                  <div key={gi} className="flex items-center justify-between py-2 px-1">
                    <p className="text-sm text-gray-400 font-medium">{span} · No meetings</p>
                    <Link href="/clubs" className="text-xs font-semibold" style={{ color: SCHEDULE_COLOR }}>
                      Fill a day →
                    </Link>
                  </div>
                );
              }
              const day = group.days[0];
              const dayMeetings = meetingsOn(day);
              const dayAbbr = day.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dayNum = day.getDate();
              return (
                <div key={gi} className="flex gap-4">
                  <div className="flex flex-col items-center w-8 shrink-0 pt-3">
                    <span className="text-[10px] font-bold text-gray-400 tracking-wider">{dayAbbr}</span>
                    <span className="text-xl font-black text-gray-800 leading-none">{dayNum}</span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    {dayMeetings.map((m) => {
                      const club = clubs.find((c) => c.id === m.club_id);
                      if (!club) return null;
                      const role = getRole(club, userId);
                      const isGoing = m.rsvp_user_ids.includes(userId);
                      const label = relativeDayLabel(m.date);
                      return (
                        <Link key={m.id} href={`/clubs/${club.id}`}>
                          <div className="flex items-start gap-3 rounded-2xl bg-white p-4" style={{ boxShadow: "0 4px 14px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.08)" }}>
                            <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={40} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-0.5">
                                <p className="font-bold text-gray-900">{club.name}</p>
                                {(role === "officer" || role === "admin") && (
                                  <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                                    style={{ backgroundColor: "#FEF3C7", color: "#D97706" }}>
                                    Officer
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{m.block} · Room {m.room} · {m.description}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {m.rsvp_user_ids.length > 0 ? `${m.rsvp_user_ids.length} going` : "Be the first to join"} · {label}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full px-3 py-1.5 text-xs font-bold"
                              style={isGoing
                                ? { backgroundColor: "#1C1C1E", color: "white" }
                                : { backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                              {isGoing ? "I'm in ✓" : "I'm in"}
                            </span>
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
        <div className="mt-6 md:mt-0 space-y-4">
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
            <div className="rounded-2xl bg-white p-4">
              <p className="font-bold text-gray-900 text-sm mb-1">Got free time?</p>
              <p className="text-xs text-gray-400 mb-3">These clubs meet on days you&apos;re open.</p>
              <div className="flex flex-wrap gap-2">
                {freeDaySuggestions.map(({ club, meeting }) => {
                  const d = new Date(meeting.date);
                  const dayAbbr = d.toLocaleDateString("en-US", { weekday: "short" });
                  return (
                    <Link key={club.id} href={`/clubs/${club.id}`}>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `#${club.color_hex}` }} />
                        {club.name} · {dayAbbr}
                      </span>
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
