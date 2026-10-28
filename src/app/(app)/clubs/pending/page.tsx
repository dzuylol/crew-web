import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Club, AppUser } from "@/types";
import ClubIcon from "@/components/ui/ClubIcon";
import PendingActions from "./PendingActions";

export default async function PendingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("users").select("is_super_admin").eq("id", user.id).single();
  if (!profile?.is_super_admin) notFound();

  const { data } = await supabase.from("clubs").select("*").eq("is_pending", true).order("name");
  const pending = (data ?? []) as Club[];

  // Fetch admin info for each club
  const adminIds = [...new Set(pending.map((c) => c.admin_id))];
  const { data: admins } = adminIds.length
    ? await supabase.from("users").select("id, first_name, last_name, email").in("id", adminIds)
    : { data: [] };
  const adminMap = Object.fromEntries((admins ?? []).map((u) => [u.id, u]));

  return (
    <div className="min-h-dvh" style={{ background: "var(--background)" }}>
      <div className="crescent-header px-5 pt-12 pb-20 text-white" style={{ backgroundColor: "#7A1F2E" }}>
        <div className="flex items-center gap-3">
          <Link href="/clubs" className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Pending approvals</h1>
            <p className="text-sm opacity-70">{pending.length} club{pending.length !== 1 ? "s" : ""} waiting</p>
          </div>
        </div>
      </div>

      <div className="-mt-10 space-y-4 px-5 pb-8">
        {pending.length === 0 ? (
          <div className="card-shadow rounded-[18px] bg-white p-6 text-center">
            <p className="text-gray-500">No clubs pending review.</p>
          </div>
        ) : (
          pending.map((club) => {
            const admin = adminMap[club.admin_id] as AppUser | undefined;
            const adminName = admin ? `${admin.first_name} ${admin.last_name}`.trim() || admin.email : "Unknown";
            return (
              <div key={club.id} className="card-shadow rounded-[18px] bg-white p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <ClubIcon colorHex={club.color_hex} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{club.name}</p>
                    <p className="text-xs text-gray-500">{club.category} · {club.meeting_frequency}</p>
                    <p className="text-xs text-gray-400">Submitted by {adminName}</p>
                  </div>
                </div>
                {club.description && <p className="text-sm text-gray-600">{club.description}</p>}
                <PendingActions clubId={club.id} clubName={club.name} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
