import { supabase } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "@tanstack/react-router";
import { authenticatedUser } from "@/lib/auth/service";
import {
  sellerDestination,
  validateStep,
  validateUpload,
  type Application,
  type DocumentRecord,
  type Fields,
} from "./model";
import { fromLive, stepPatch, liveDocumentTypes, type LiveApplication } from "./live-contract";
// Reuse the existing authenticated client. This type describes catalog-verified
// tables absent from the repository's older generated Supabase types.
type Row = Record<string, unknown>;
type Table = { Row: Row; Insert: Row; Update: Row; Relationships: [] };
type SellerDatabase = {
  public: {
    Tables: {
      seller_applications: Table;
      seller_application_documents: Table;
      seller_stores: Table;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
const db = supabase as unknown as SupabaseClient<SellerDatabase>;
function check<T>(result: { data: T; error: unknown }): T {
  if (result.error) throw result.error;
  return result.data;
}
export function friendlyError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Something went wrong. Please try again.";
  if (/unique|duplicate/i.test(message))
    return "This store name, slug, or business registration is already in use. Please choose another.";
  if (/failed to fetch|network|load failed/i.test(message))
    return "Connection interrupted. Your unsaved changes are still on this page. Reconnect and retry.";
  if (/JWT|session|token.*expired/i.test(message))
    return "Your session expired. Sign in again to continue.";
  if (/permission|row.level.security/i.test(message))
    return "You do not have permission to make this change. Check your session and application status.";
  return message;
}
async function userId() {
  const user = await authenticatedUser();
  if (!user) throw new Error("Your session expired.");
  return user.id;
}
async function ownedApplication(): Promise<LiveApplication | null> {
  const id = await userId();
  return check(
    await db.from("seller_applications").select("*").eq("user_id", id).maybeSingle(),
  ) as LiveApplication | null;
}
function editable(app: LiveApplication) {
  if (!["DRAFT", "REJECTED", "MORE_INFORMATION_REQUIRED"].includes(app.status))
    throw new Error("Submitted or restricted seller applications cannot be edited.");
}
async function updateApplication(app: LiveApplication, patch: Row) {
  editable(app);
  const row = check(
    await db
      .from("seller_applications")
      .update(patch)
      .eq("id", app.id)
      .eq("user_id", await userId())
      .eq("updated_at", app.updated_at)
      .select("*")
      .maybeSingle(),
  );
  if (!row)
    throw new Error(
      "Your application changed in another tab. Reload before making further changes.",
    );
  return row as LiveApplication;
}
export async function eligibility(continuation = "/seller/register") {
  const user = await authenticatedUser();
  if (!user) throw redirect({ href: `/login?next=${encodeURIComponent(continuation)}` });
  const profile = check(
    await supabase.from("profiles").select("role,status").eq("id", user.id).single(),
  );
  if (!profile || !["BUYER", "SELLER"].includes(profile.role))
    throw new Error("Seller registration is available to Buyer accounts only.");
  const [application, seller] = await Promise.all([
    db.from("seller_applications").select("status").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("seller_profiles")
      .select("application_status")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const current = check(application);
  const existing = check(seller);
  return {
    user,
    profile,
    seller: current ? { application_status: String(current["status"]) } : existing,
  };
}
export async function guardSeller(page: "register" | "status" | "dashboard") {
  const context = await eligibility(`/seller/${page}`);
  const destination = sellerDestination(context.seller?.application_status, context.profile.status);
  if (
    (page === "dashboard" && destination !== "/seller/dashboard") ||
    (page !== "dashboard" && destination === "/seller/dashboard") ||
    (page === "register" && destination === "/seller/status")
  )
    throw redirect({ href: destination });
  return context;
}
export async function startApplication(): Promise<Application> {
  let app = await ownedApplication();
  if (!app) {
    const context = await eligibility();
    if (context.profile.role !== "BUYER" || context.profile.status !== "ACTIVE")
      throw new Error("An active Buyer account is required.");
    const result = await db
      .from("seller_applications")
      .insert({ user_id: context.user.id })
      .select("*")
      .single();
    if (result.error?.code === "23505") app = await ownedApplication();
    else app = check(result) as LiveApplication;
  }
  if (!app) throw new Error("Application could not be loaded. Please retry.");
  editable(app);
  return fromLive(app);
}
export async function loadApplication(): Promise<Application> {
  const app = await ownedApplication();
  if (!app) throw new Error("Start seller registration first.");
  return fromLive(app);
}
export async function saveStep(
  step: number,
  values: Fields,
  revision: string,
  complete = false,
): Promise<Application> {
  const app = await ownedApplication();
  if (!app) throw new Error("Application unavailable.");
  if (app.updated_at !== revision)
    throw new Error("Your application changed in another tab. Reload before continuing.");
  const current = fromLive(app);
  current.data[step] = values;
  const docs = await listDocuments();
  if (complete) {
    const errors = Array.from({ length: step + 1 }, (_, i) =>
      validateStep(i, current.data, docs),
    ).flat();
    if (errors.length) throw new Error(errors.join(" "));
  }
  const completed = app.completed_steps.filter((i) => i < step + 1);
  if (complete) completed.push(step + 1);
  // Editing an earlier section invalidates later completion until revalidated.
  return fromLive(
    await updateApplication(app, {
      ...stepPatch(step, values),
      completed_steps: completed,
      current_step: complete ? Math.min(step + 2, 6) : step + 1,
      progress_percent: Math.round((completed.length / 6) * 100),
    }),
  );
}
export async function listDocuments(): Promise<DocumentRecord[]> {
  const app = await ownedApplication();
  if (!app) return [];
  const rows = check(
    await db
      .from("seller_application_documents")
      .select("*")
      .eq("application_id", app.id)
      .eq("user_id", app.user_id),
  );
  const docs = (rows ?? []).map((row) => ({
    kind:
      Object.keys(liveDocumentTypes).find((k) => liveDocumentTypes[k] === row["document_type"]) ??
      "",
    path: String(row["storage_path"]),
    bucket: String(row["bucket_name"]),
    name: String(row["file_name"]),
    mime: String(row["mime_type"]),
    size: Number(row["file_size_bytes"]),
  }));
  for (const kind of ["logo", "banner"]) {
    const path = app[`store_${kind}_path`];
    if (path)
      docs.push({
        kind,
        path: String(path),
        bucket: `store-${kind === "logo" ? "logos" : "banners"}`,
        name: String(path).split("/").pop()!,
        mime: "image/*",
        size: 0,
      });
  }
  return docs;
}
export async function uploadDocument(kind: string, file: File, previous?: DocumentRecord) {
  const artwork = kind === "logo" || kind === "banner";
  if (!artwork && !liveDocumentTypes[kind]) throw new Error("Unsupported document type.");
  await validateUpload(file, artwork);
  if (kind === "logo" && file.size > 5 * 1024 * 1024)
    throw new Error("Store logos must be no larger than 5 MB.");
  const app = await ownedApplication();
  if (!app) throw new Error("Application unavailable.");
  editable(app);
  const bucket = artwork ? `store-${kind === "logo" ? "logos" : "banners"}` : "seller-documents";
  const ext = file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const path = `${app.user_id}/${app.id}/${kind}/${crypto.randomUUID()}.${ext}`;
  check(
    await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false }),
  );
  try {
    if (artwork) await updateApplication(app, { [`store_${kind}_path`]: path });
    else
      check(
        await db.from("seller_application_documents").upsert(
          {
            application_id: app.id,
            user_id: app.user_id,
            document_type: liveDocumentTypes[kind],
            bucket_name: bucket,
            storage_path: path,
            file_name: file.name,
            mime_type: file.type,
            file_size_bytes: file.size,
          },
          { onConflict: "application_id,document_type" },
        ),
      );
  } catch (error) {
    await supabase.storage.from(bucket).remove([path]);
    throw error;
  }
  if (previous) check(await supabase.storage.from(previous.bucket).remove([previous.path]));
}
export async function deleteDocument(document: DocumentRecord) {
  const app = await ownedApplication();
  if (!app) throw new Error("Application unavailable.");
  editable(app);
  const current = (await listDocuments()).find((d) => d.kind === document.kind);
  if (!current || current.path !== document.path || current.bucket !== document.bucket)
    throw new Error("The document changed. Reload before deleting.");
  if (["logo", "banner"].includes(document.kind))
    await updateApplication(app, { [`store_${document.kind}_path`]: null });
  else
    check(
      await db
        .from("seller_application_documents")
        .delete()
        .eq("application_id", app.id)
        .eq("user_id", app.user_id)
        .eq("storage_path", document.path),
    );
  check(await supabase.storage.from(document.bucket).remove([document.path]));
}
export async function previewDocument(document: DocumentRecord) {
  const result = check(
    await supabase.storage.from(document.bucket).createSignedUrl(document.path, 60),
  );
  if (!result) throw new Error("Preview unavailable. Please retry.");
  return result.signedUrl;
}
export async function submitApplication(revision: string, confirm: boolean, terms: boolean) {
  if (!confirm || !terms) throw new Error("Confirm your information and accept the Seller Terms.");
  const app = await ownedApplication();
  if (!app || app.updated_at !== revision)
    throw new Error("Your application changed. Reload before submitting.");
  const data = fromLive(app).data;
  const docs = await listDocuments();
  const errors = [0, 1, 2, 3, 4].flatMap((i) => validateStep(i, data, docs));
  if (errors.length) throw new Error(errors.join(" "));
  const timestamp = new Date().toISOString();
  return fromLive(
    await updateApplication(app, {
      status: "SUBMITTED",
      information_confirmed: true,
      seller_terms_accepted: true,
      seller_terms_accepted_at: timestamp,
      submitted_at: app.submitted_at ?? timestamp,
      ...(app.submitted_at ? { resubmitted_at: timestamp } : {}),
      completed_steps: [1, 2, 3, 4, 5, 6],
      current_step: 6,
      progress_percent: 100,
    }),
  );
}
export async function applicationComments(id: string) {
  if ((await userId()) !== id) throw new Error("Permission denied.");
  const app = await ownedApplication();
  return app?.["admin_comments"]
    ? [{ id: app.id, comment: String(app["admin_comments"]), created_at: app.updated_at }]
    : [];
}
export async function sellerReceipt(id: string) {
  if ((await userId()) !== id) throw new Error("Permission denied.");
  const app = await ownedApplication();
  const store = check(
    await db.from("seller_stores").select("id").eq("seller_user_id", id).maybeSingle(),
  );
  return {
    sellerId: id,
    application: app ? { id: app.id, submitted_at: app.submitted_at } : null,
    store: store ? { id: String(store["id"]) } : null,
  };
}
