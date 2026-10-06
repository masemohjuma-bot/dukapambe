import { useCallback, useEffect, useRef, useState } from "react";
import type { Application, DocumentRecord, Fields } from "@/lib/seller/model";
import {
  friendlyError,
  listDocuments,
  loadApplication,
  saveStep,
  startApplication,
} from "@/lib/seller/service";
import { supabase } from "@/integrations/supabase/client";

export function useSellerOnboarding() {
  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [data, setData] = useState<Fields[]>([{}, {}, {}, {}, {}, {}]);
  const dataRef = useRef(data);
  const applicationRef = useRef<Application | null>(null);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const dirty = useRef(false);
  const alive = useRef(true);
  const apply = useCallback((app: Application) => {
    applicationRef.current = app;
    setApplication(app);
  }, []);
  const refresh = useCallback(async () => {
    const [app, docs] = await Promise.all([loadApplication(), listDocuments()]);
    apply(app);
    setDocuments(docs);
    return app;
  }, [apply]);
  useEffect(() => {
    alive.current = true;
    void startApplication()
      .then(async (app) => {
        if (!alive.current) return;
        apply(app);
        dataRef.current = app.data;
        setData(app.data);
        setDocuments(await listDocuments());
        setStep(Math.min(app.completed_steps.length, 5));
        setSaved("Saved");
      })
      .catch((e) => setError(friendlyError(e)));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        setError("Your session expired. Sign in again to continue.");
      }
    });
    const beforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      alive.current = false;
      subscription.unsubscribe();
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, [apply]);
  const persist = useCallback(
    (index: number, complete = false) => {
      const snapshot = { ...dataRef.current[index] };
      const operation = queue.current
        .catch(() => undefined)
        .then(async () => {
          const app = applicationRef.current;
          if (!app) throw new Error("Application is still loading.");
          setBusy(true);
          setSaved("Saving…");
          try {
            const result = await saveStep(index, snapshot, app.revision, complete);
            apply(result);
            if (JSON.stringify(dataRef.current[index]) === JSON.stringify(snapshot)) {
              dirty.current = false;
              setSaved("Saved");
            } else setSaved("Unsaved changes");
            setError("");
            return result;
          } catch (e) {
            setSaved("Not saved — retry");
            setError(friendlyError(e));
            throw e;
          } finally {
            setBusy(false);
          }
        });
      queue.current = operation;
      return operation;
    },
    [apply],
  );
  const update = (key: string, value: string) => {
    const next = dataRef.current.map((values, i) =>
      i === step ? { ...values, [key]: value } : values,
    );
    dataRef.current = next;
    dirty.current = true;
    setSaved("Unsaved changes");
    setData(next);
  };
  useEffect(() => {
    if (!application || step === 5 || !dirty.current) return;
    const timer = setTimeout(() => {
      void persist(step).catch(() => undefined);
    }, 900);
    return () => clearTimeout(timer);
  }, [data, step, application, persist]);
  const exclusive = useCallback((fn: () => Promise<unknown>) => {
    const operation = queue.current
      .catch(() => undefined)
      .then(async () => {
        setBusy(true);
        try {
          return await fn();
        } finally {
          setBusy(false);
        }
      });
    queue.current = operation;
    return operation;
  }, []);
  return {
    exclusive,
    application,
    applicationRef,
    documents,
    data,
    step,
    setStep,
    busy,
    setBusy,
    saved,
    error,
    setError,
    update,
    persist,
    refresh,
  };
}
