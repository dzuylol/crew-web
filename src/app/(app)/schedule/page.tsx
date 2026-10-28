"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Club, Meeting } from "@/types";
import { getRole, relativeDayLabel } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";

const SCHEDULE_COLOR = "#3B6EA5";

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
      if (!user) return;
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

  if (loading || !userId) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#3B6EA5]" />
      </div>
    );
  }

  const joinedClubIds = new Set(clubs.filter((c) => getRole(c, userId) !== null).map((c) => c.id));
  const myMeetings = meetings.filter((m) => joinedClubIds.has(m.club_id));

  const weekStart = startOfWeek(new Date(), weekOffset);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}–${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${weekEnd.getFullYear()}`;

  function meetingsOn(day: Date) {
    return myMeetings.filter((m) => sameDay(new Date(m.date), day));
  }

  const daysWithMeetings = weekDays.filter((d) => meetingsOn(d).length > 0);

  return (
    <div className="min-h-dvh">
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: SCHEDULE_COLOR }}>
        <h1 className="text-2xl font-bold">My Schedule</h1>
      </div>

      <div className="-mt-10 space-y-5 px-5 pb-8">
        {/* Week navigator */}
        <div className="card-shadow flex items-center justify-between rounded-[16px] bg-white px-4 py-3">
          <button onClick={() => setWeekOffset((w) => w - 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <span className="text-sm font-semibold text-gray-700">{weekLabel}</span>
          <button onClick={() => setWeekOffset((w) => w + 1)} className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2.5"><path d="m9 18 6-6-6-6" /></svg>
          </button>
        </div>

        {/* Day strip */}
        <div className="flex justify-between gap-1">
          {weekDays.map((day) => {
            const hasMeeting = meetingsOn(day).length > 0;
            const isSelected = sameDay(day, selectedDay);
            const isToday = sameDay(day, new Date());
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className="flex flex-1 flex-col items-center gap-1 rounded-xl py-2"
                style={isSelected ? { backgroundColor: SCHEDULE_COLOR } : undefined}
              >
                <span className="text-[10px] font-semibold" style={{ color: isSelected ? "white" : "#9CA3AF" }}>
                  {day.toLocaleDateString("en-US", { weekday: "short" }).charAt(0)}
                </span>
                <span className="text-sm font-bold" style={{ color: isSelected ? "white" : isToday ? SCHEDULE_COLOR : "#374151" }}>
                  {day.getDate()}
                </span>
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: hasMeeting ? (isSelected ? "white" : SCHEDULE_COLOR) : "transparent" }}
                />
              </button>
            );
          })}
        </div>

        {/* Meeting list */}
        {daysWithMeetings.length === 0 ? (
          <div className="card-shadow rounded-[18px] bg-white p-5 text-center">
            <p className="text-sm text-gray-500">No meetings this week.</p>
            <Link href="/clubs" className="mt-3 inline-block text-sm font-semibold" style={{ color: SCHEDULE_COLOR }}>
              Explore clubs →
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {daysWithMeetings.map((day) => {
              const dayMeetings = meetingsOn(day);
              const dayLabel = day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
              return (
                <div key={day.toISOString()} className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">{dayLabel}</p>
                  {dayMeetings.map((m) => {
                    const club = clubs.find((c) => c.id === m.club_id);
                    if (!club) return null;
                    return (
                      <Link key={m.id} href={`/clubs/${club.id}`}>
                        <div className="card-shadow flex items-start gap-3 rounded-[16px] bg-white p-4">
                          <ClubIcon colorHex={club.color_hex} iconName={club.icon_name} size={40} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs text-gray-400">
                                {new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {m.block}
                              </span>
                              <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ backgroundColor: "#D1486B18", color: "#D1486B" }}>
                                {relativeDayLabel(m.date)}
                              </span>
                            </div>
                            <p className="mt-1 font-semibold text-gray-900">{m.title}</p>
                            <p className="text-sm text-gray-500">Room {m.room} · {m.description}</p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
