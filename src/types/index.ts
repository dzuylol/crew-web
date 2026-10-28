export type ClubCategory = "STEM" | "Service" | "Games" | "Arts" | "Other";

export interface Club {
  id: string;
  name: string;
  description: string;
  color_hex: string;
  icon_name: string;
  category: ClubCategory;
  meeting_frequency: string;
  admin_id: string;
  officer_ids: string[];
  member_ids: string[];
  is_pending: boolean;
}

export interface Meeting {
  id: string;
  club_id: string;
  title: string;
  date: string;
  block: string;
  room: string;
  description: string;
  rsvp_user_ids: string[];
}

export interface Announcement {
  id: string;
  club_id: string;
  title: string;
  body: string;
  date: string;
  is_read: boolean;
}

export interface AppUser {
  id: string;
  apple_user_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  is_super_admin: boolean;
  created_at: string;
}

export type ClubRole = "admin" | "officer" | "member";

export function getRole(club: Club, userId: string): ClubRole | null {
  if (club.admin_id === userId) return "admin";
  if (club.officer_ids.includes(userId)) return "officer";
  if (club.member_ids.includes(userId)) return "member";
  return null;
}

export function canManage(club: Club, userId: string, isSuperAdmin = false): boolean {
  if (isSuperAdmin) return true;
  const role = getRole(club, userId);
  return role === "admin" || role === "officer";
}

export function isClubAdmin(club: Club, userId: string, isSuperAdmin = false): boolean {
  return isSuperAdmin || club.admin_id === userId;
}

export function displayName(user: AppUser): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.email || "Unknown";
}

export function allMemberCount(club: Club): number {
  return new Set([club.admin_id, ...club.officer_ids, ...club.member_ids]).size;
}

export const CATEGORIES: ClubCategory[] = ["STEM", "Service", "Games", "Arts", "Other"];

export const PALETTE_HEXES = [
  "7A1F2E", "3B6EA5", "8470C8", "2E8B8B", "E0922B", "1C3F60",
  "2B2B2B", "A8456B", "4F8F4F", "C9A227", "6A4C93", "D1486B",
  "2E6F6E", "8C4A2F", "55606E", "B5512E",
];

export const CLUB_ICONS = [
  "crown", "medal", "cpu", "palette",
  "gamepad-2", "theater", "music", "book",
  "flask-conical", "leaf", "globe", "camera",
  "trophy", "person-running", "moon", "hammer",
  "pencil", "users", "star", "graduation-cap",
  "monitor", "atom", "mic", "heart",
];

export function stableColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffffffff;
  }
  return "#" + PALETTE_HEXES[Math.abs(hash) % PALETTE_HEXES.length];
}

export function daysFromNow(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const diff = date.getTime() - now.getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function relativeDayLabel(dateStr: string): string {
  const days = daysFromNow(dateStr);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days}d`;
}
