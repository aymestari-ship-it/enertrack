"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ErrorMessage, Spinner } from "@/components/ui/Feedback";
import Logo from "@/components/ui/Logo";
import { BUTTON_PRIMARY, CARD, FIELD, LABEL, LINK } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // proxy.ts will redirect to the right page for the user's role.
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <form onSubmit={handleSubmit} className={`${CARD} flex flex-col gap-4 p-6 sm:p-8`}>
          <label className="flex flex-col gap-1.5">
            <span className={LABEL}>Email</span>
            <input
              type="email"
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${FIELD} w-full`}
            />
          </label>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <button type="submit" disabled={loading} className={`${BUTTON_PRIMARY} mt-1 w-full`}>
            {loading && <Spinner />}
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/signup" className={`${LINK} inline-flex min-h-11 items-center`}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
