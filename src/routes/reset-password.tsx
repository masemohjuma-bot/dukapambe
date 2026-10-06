import { createFileRoute, useRouter, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { authError, updatePassword } from "@/lib/auth/service";
import { supabase } from "@/integrations/supabase/client";
import { safeNext } from "@/lib/auth/navigation";
export const Route = createFileRoute("/reset-password")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? s["next"] : "/",
  }),
  beforeLoad: async ({ search }) => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session)
      throw redirect({
        href: `/forgot-password?next=${encodeURIComponent(safeNext(search.next, window.location.origin))}`,
      });
  },
  component: ResetPassword,
});
function ResetPassword() {
  const { next } = Route.useSearch();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Choose a new password</h1>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (password !== confirmation) {
              setError("Passwords do not match.");
              return;
            }
            setBusy(true);
            setError("");
            void updatePassword(password)
              .then(() =>
                router.navigate({ href: safeNext(next, window.location.origin), replace: true }),
              )
              .catch((e) => setError(authError(e)))
              .finally(() => setBusy(false));
          }}
        >
          <label htmlFor="new-password" className="block text-sm font-medium">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <label htmlFor="confirm-password" className="block text-sm font-medium">
            Confirm password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            minLength={8}
            required
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Updating…" : "Update password"}
          </button>
        </form>
        <a
          href="/forgot-password"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Request another reset link
        </a>
      </div>
    </main>
  );
}
