import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { safeNext, authCallbackUrl } from "@/lib/auth/navigation";
import { authError, guestDestination } from "@/lib/auth/service";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/signup")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? s["next"] : "/",
  }),
  beforeLoad: async ({ search }) => {
    const destination = await guestDestination(search.next);
    if (destination) throw redirect({ href: destination });
  },
  component: Signup,
});

function sanitizeNext(next: string) {
  return safeNext(next, window.location.origin);
}

function Signup() {
  const { next } = Route.useSearch();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: authCallbackUrl(next, window.location.origin) },
      });
      if (error) throw error;
      if (data.session) await router.navigate({ href: sanitizeNext(next) });
      else setConfirmationSent(true);
    } catch (e) {
      setError(authError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
          Create account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign up to use Dukapambe.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-card-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setConfirmationSent(false);
              }}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-card-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {confirmationSent && (
            <p role="status" className="text-sm text-muted-foreground">
              Check your email to confirm your account. The verification link will continue to your
              requested page.
            </p>
          )}
          <button
            type="submit"
            disabled={busy || confirmationSent}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Creating account..." : "Sign up"}
          </button>
        </form>
        <a
          href={`/login?next=${encodeURIComponent(sanitizeNext(next))}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Already confirmed? Sign in
        </a>
      </div>
    </main>
  );
}
