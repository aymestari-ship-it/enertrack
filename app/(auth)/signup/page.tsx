"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    // full_name is read by the handle_new_user trigger (raw_user_meta_data).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // No session means email confirmation is enabled in Supabase.
    if (!data.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    // A new account is always a site_manager without a site.
    router.push("/pending");
    router.refresh();
  }

  if (checkEmail) {
    return (
      <main className="flex flex-1 items-center justify-center bg-surface px-4 text-ink">
        <div className="w-full max-w-xs text-center">
          <h1 className="mb-4 text-2xl font-bold text-brand">EnerTrack</h1>
          <p>Check your email to confirm your account, then log in.</p>
          <Link href="/login" className="mt-4 inline-block text-sm text-brand underline">
            Back to log in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-surface px-4 text-ink">
      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
        <h1 className="mb-4 text-center text-2xl font-bold text-brand">EnerTrack</h1>

        <input
          type="text"
          placeholder="Full name"
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded border border-line-strong bg-panel px-3 py-2"
        />
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded border border-line-strong bg-panel px-3 py-2"
        />
        <input
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded border border-line-strong bg-panel px-3 py-2"
        />

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-brand py-2 font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {loading ? "Signing up…" : "Sign up"}
        </button>

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-brand underline">
            Log in
          </Link>
        </p>
      </form>
    </main>
  );
}
