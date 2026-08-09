import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Typed wrapper for the beta supabase.auth.oauth namespace.
interface OAuthApi {
  getAuthorizationDetails: (authorizationId: string) => Promise<{
    data: AuthorizationDetails | null;
    error: Error | null;
  }>;
  approveAuthorization: (authorizationId: string) => Promise<{
    data: AuthorizationDecision | null;
    error: Error | null;
  }>;
  denyAuthorization: (authorizationId: string) => Promise<{
    data: AuthorizationDecision | null;
    error: Error | null;
  }>;
}

interface AuthorizationClient {
  name?: string;
}

interface AuthorizationDetails {
  client?: AuthorizationClient;
  redirect_url?: string;
  redirect_to?: string;
  requested_scopes?: string[];
}

interface AuthorizationDecision {
  redirect_url?: string;
  redirect_to?: string;
}

function getOAuthApi(): OAuthApi {
  const api = (supabase.auth as unknown as { oauth?: OAuthApi }).oauth;
  if (!api) {
    throw new Error("supabase.auth.oauth is not available");
  }
  return api;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id:
      typeof s["authorization_id"] === "string" ? s["authorization_id"] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search["authorization_id"]) {
      throw new Error("Missing authorization_id");
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ to: "/login", search: { next } });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get(
      "authorization_id",
    )!;
    const { data, error } = await getOAuthApi().getAuthorizationDetails(
      authorizationId,
    );
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) {
      throw redirect({ href: immediate });
    }
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Could not load this authorization request
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {String((error as Error)?.message ?? error)}
        </p>
      </div>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await getOAuthApi().approveAuthorization(authorization_id)
      : await getOAuthApi().denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an app";
  const scopes = details?.requested_scopes ?? ["openid", "email", "profile"];

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-card-foreground">
          Connect {clientName} to your account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This lets {clientName} use Dukapambe as you.
        </p>

        <div className="mt-4 space-y-2 text-sm text-card-foreground">
          <p>
            <span className="font-medium">Identity access:</span>{" "}
            {scopes.includes("email") && "Share your email address"}
            {scopes.includes("profile") && scopes.includes("email") && " and "}
            {scopes.includes("profile") && "Share your basic profile"}
          </p>
          <p className="text-xs text-muted-foreground">
            This does not bypass this app&apos;s permissions or backend policies.
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-3">
          <button
            disabled={busy}
            onClick={() => decide(true)}
            className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {busy ? "Connecting..." : "Approve"}
          </button>
          <button
            disabled={busy}
            onClick={() => decide(false)}
            className="inline-flex flex-1 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel connection
          </button>
        </div>
      </div>
    </main>
  );
}
