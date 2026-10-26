import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to Crew</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
        <p className="text-xs text-gray-400">Clubs feed coming soon.</p>
      </div>
    </main>
  );
}
