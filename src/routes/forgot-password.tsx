import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { authError, requestPasswordReset } from "@/lib/auth/service";
export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? s["next"] : "/",
  }),
  component: ForgotPassword,
});
function ForgotPassword() {
  const { next } = Route.useSearch();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your account email to request a reset link.
        </p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            void requestPasswordReset(email, next)
              .then(() => setSent(true))
              .catch((e) => setError(authError(e)))
              .finally(() => setBusy(false));
          }}
        >
          <label htmlFor="reset-email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
            }}
            required
            className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {sent && (
            <p role="status" className="text-sm text-muted-foreground">
              If this email belongs to an account, a reset link has been sent. Check your inbox.
            </p>
          )}
          <button
            disabled={busy || sent}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send reset link"}
          </button>
        </form>
        <a href="/login" className="mt-4 inline-block text-sm text-primary hover:underline">
          Return to sign in
        </a>
      </div>
    </main>
  );
}
