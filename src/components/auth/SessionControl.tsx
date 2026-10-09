import { useState } from "react";
import { useAccountSession } from "@/hooks/use-account-session";
import { authError, logout } from "@/lib/auth/service";
export function SessionControl({ className }: { className: string }) {
  const { session } = useAccountSession();
  const [busy, setBusy] = useState(false);
  if (!session)
    return (
      <>
        <a href="/signup" className={className}>
          Jisajili
        </a>
        <a href="/login" className={className}>
          Ingia
        </a>
      </>
    );
  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      onClick={() => {
        setBusy(true);
        void logout()
          .catch((e) => window.alert(authError(e)))
          .finally(() => setBusy(false));
      }}
    >
      {busy ? "Inatoka…" : "Toka"}
    </button>
  );
}
