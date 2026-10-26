"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function OnboardingPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { error: updateError } = await supabase
      .from("users")
      .update({ first_name: firstName.trim(), last_name: lastName.trim() })
      .eq("id", user.id);

    if (updateError) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    router.push("/");
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome to Crew</h1>
          <p className="mt-2 text-sm text-gray-500">What should we call you?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7A1F2E] focus:ring-1 focus:ring-[#7A1F2E]"
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#7A1F2E] focus:ring-1 focus:ring-[#7A1F2E]"
            />
          </div>

          {error && (
            <p className="text-center text-sm text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !firstName.trim()}
            className="w-full rounded-xl py-3 font-semibold text-white transition disabled:opacity-50"
            style={{ backgroundColor: "#7A1F2E" }}
          >
            {loading ? "Saving…" : "Get started"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400">
          This is how you&apos;ll appear in club rosters.
        </p>
      </div>
    </main>
  );
}
