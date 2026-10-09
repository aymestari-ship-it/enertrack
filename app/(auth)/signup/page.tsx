"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorMessage, Spinner } from "@/components/ui/Feedback";
import Logo from "@/components/ui/Logo";
import { BUTTON_PRIMARY, CARD, FIELD, LABEL, LINK } from "@/components/ui/styles";
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
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
          <div className={`${CARD} p-6 text-center sm:p-8`}>
            <p className="text-ink">Check your email to confirm your account, then log in.</p>
            <Link href="/login" className={`${LINK} mt-4 inline-flex min-h-11 items-center text-sm`}>
              Back to log in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <form onSubmit={handleSubmit} className={`${CARD} flex flex-col gap-4 p-6 sm:p-8`}>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Full name</span>
            <input
              type="text"
              placeholder="Full name"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={`${FIELD} w-full`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Email</span>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${FIELD} w-full`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Password</span>
            <input
              type="password"
              placeholder="Password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${FIELD} w-full`}
            />
          </label>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <button type="submit" disabled={loading} className={`${BUTTON_PRIMARY} mt-1 w-full`}>
            {loading && <Spinner />}
            {loading ? "Signing up…" : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className={LINK}>
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
