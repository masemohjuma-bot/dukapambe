import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { shouldRecheckAuthRoutes } from "@/lib/auth/navigation";

export function useAuthRouteRefresh() {
  const router = useRouter();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const schedule = (event: string) => {
      if (!shouldRecheckAuthRoutes(event, router.state.location.pathname)) return;
      clearTimeout(timer);
      // Leave the Supabase Auth callback before guards call Auth methods. Running
      // those methods synchronously inside the callback can wait on its own lock.
      timer = setTimeout(() => {
        if (active) void router.invalidate().catch(() => undefined);
      }, 0);
    };
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => schedule(event));
    const onFocus = () => schedule("TOKEN_REFRESHED");
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearTimeout(timer);
      subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
    };
  }, [router]);
}
