import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount, authError } from "@/lib/auth/service";
export function useAccountSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(authError(error));
        setSession(data.session);
      })
      .catch((e) => {
        if (active) setError(authError(e));
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, current) => {
      if (active) setSession(current);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let active = true;
    if (!session) {
      setRole(null);
      return;
    }
    void loadAccount()
      .then((account) => {
        if (active) {
          setRole(account?.role ?? null);
          setError("");
        }
      })
      .catch((e) => {
        if (active) setError(authError(e));
      });
    return () => {
      active = false;
    };
  }, [session]);
  return { session, role, error };
}
