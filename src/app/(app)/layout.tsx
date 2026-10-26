export const instant = false;

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BottomNav from "./BottomNav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("first_name")
    .eq("id", user.id)
    .single();

  if (!profile?.first_name) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh flex-col bg-[#EEEEF2]">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
