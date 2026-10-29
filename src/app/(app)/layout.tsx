export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "./BottomNav";
import Sidebar from "@/components/Sidebar";
import type { AppUser } from "@/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let profile: AppUser | null = null;

  if (user) {
    const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
    profile = data as AppUser | null;
    if (!profile?.first_name) redirect("/onboarding");
  }

  return (
    <div className="flex min-h-dvh" style={{ background: "var(--background)" }}>
      {/* Desktop sidebar */}
      <Sidebar profile={profile} />

      {/* Main content — offset on desktop for sidebar */}
      <div className="flex flex-1 flex-col md:pl-[220px]">
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        {/* Mobile bottom nav */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}
