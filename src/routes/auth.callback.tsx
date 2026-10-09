import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { authError, completeAuthCallback } from "@/lib/auth/service";
import { safeNext } from "@/lib/auth/navigation";
export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s["next"] === "string" ? s["next"] : "/",
  }),
  component: AuthCallback,
});
function AuthCallback() {
  const { next } = Route.useSearch();
  const continuation = encodeURIComponent(safeNext(next, window.location.origin));
  const router = useRouter();
  const [error, setError] = useState("");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void completeAuthCallback()
      .then((href) => router.navigate({ href, replace: true }))
      .catch((e) => setError(authError(e)));
  }, [router]);
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Verify your account</h1>
        {error ? (
          <>
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
            <a
              href={`/login?next=${continuation}`}
              className="mt-4 inline-block text-primary hover:underline"
            >
              Return to sign in
            </a>
            <a
              href={`/forgot-password?next=${continuation}`}
              className="mt-4 ml-4 inline-block text-primary hover:underline"
            >
              Reset password
            </a>
          </>
        ) : (
          <p role="status" className="mt-4 text-sm text-muted-foreground">
            Verifying your email and recovering your session…
          </p>
        )}
      </div>
    </main>
  );
}
