import { supabase } from "@/integrations/supabase/client";
import type { Application, DocumentRecord, Fields } from "./model";
import { sellerDestination, validateUpload } from "./model";
import { redirect } from "@tanstack/react-router";

export function friendlyError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String(error.message)
        : "Something went wrong. Please try again.";
  if (/seller_stores_name_unique/i.test(message))
    return "This Store Name is already in use. Please choose another.";
  if (/seller_stores_slug_unique/i.test(message))
    return "This Store Slug is already in use. Please choose another.";
  if (/seller_registration_unique/i.test(message))
    return "This business registration is already linked to another seller.";
  if (/failed to fetch|network|load failed/i.test(message))
    return "Connection interrupted. Your unsaved changes are still on this page. Reconnect and retry.";
  if (/JWT|session|token.*expired/i.test(message))
    return "Your session expired. Sign in again to continue.";
  if (/schema cache|does not exist|could not find.*function/i.test(message))
    return "Seller registration is temporarily unavailable. Please contact support.";
  return message;
}
function check<R extends { data: unknown; error: unknown }>(result: R): R["data"] {
  if (result.error) throw result.error;
  return result.data;
}
export async function eligibility() {
  const response = await supabase.auth.getUser();
  if (
    response.error &&
    (response.error.status === 401 ||
      response.error.code === "session_not_found" ||
      response.error.name === "AuthSessionMissingError")
  )
    throw redirect({ href: "/login?next=%2Fseller%2Fregister" });
  const user = check(response).user;
  if (!user) throw redirect({ href: "/login?next=%2Fseller%2Fregister" });
  const profile = check(
    await supabase.from("profiles").select("role,status").eq("id", user.id).single(),
  );
  if (!profile) throw new Error("Your Buyer profile is unavailable. Please contact support.");
  if (!["BUYER", "SELLER"].includes(profile.role))
    throw new Error("Seller registration is available to Buyer accounts only.");
  const seller = check(
    await supabase
      .from("seller_profiles")
      .select("application_status")
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  return { user, profile, seller };
}
export async function guardSeller(page: "register" | "status" | "dashboard") {
  const session = check(await supabase.auth.getSession()).session;
  if (!session) throw redirect({ href: `/login?next=${encodeURIComponent(`/seller/${page}`)}` });
  const context = await eligibility();
  const destination = sellerDestination(context.seller?.application_status, context.profile.status);
  if (destination === "/seller/dashboard") {
    check(await supabase.rpc("seller_activate"));
    if (page !== "dashboard") throw redirect({ href: destination });
  } else if (page === "dashboard" || (page === "register" && destination === "/seller/status"))
    throw redirect({ href: destination });
  return context;
}
export async function startApplication(): Promise<Application> {
  return check(await supabase.rpc("seller_start")) as Application;
}
export async function loadApplication(): Promise<Application> {
  const user = check(await supabase.auth.getUser()).user;
  if (!user) throw new Error("Your session expired.");
  return check(
    await supabase.from("seller_onboarding").select("*").eq("user_id", user.id).single(),
  ) as Application;
}
export async function saveStep(
  step: number,
  values: Fields,
  revision: number,
  complete = false,
): Promise<Application> {
  return check(
    await supabase.rpc("seller_save_step", {
      p_step: step,
      p_values: values,
      p_revision: revision,
      p_complete: complete,
    }),
  ) as Application;
}
export async function listDocuments(): Promise<DocumentRecord[]> {
  const user = check(await supabase.auth.getUser()).user;
  if (!user) throw new Error("Your session expired.");
  return check(
    await supabase.from("seller_documents").select("*").eq("user_id", user.id),
  ) as DocumentRecord[];
}
export async function uploadDocument(kind: string, file: File, previous?: DocumentRecord) {
  await validateUpload(file, kind === "logo" || kind === "banner");
  const user = check(await supabase.auth.getUser()).user;
  if (!user) throw new Error("Your session expired.");
  const bucket =
    kind === "logo" ? "seller-logos" : kind === "banner" ? "seller-banners" : "seller-documents";
  const extension =
    file.type === "application/pdf" ? "pdf" : file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/${kind}/${crypto.randomUUID()}.${extension}`;
  check(
    await supabase.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false }),
  );
  try {
    check(
      await supabase.rpc("seller_set_document", {
        p_kind: kind,
        p_bucket: bucket,
        p_path: path,
        p_name: file.name,
        p_mime: file.type,
        p_size: file.size,
      }),
    );
  } catch (error) {
    await supabase.storage.from(bucket).remove([path]);
    throw error;
  }
  if (previous) {
    const result = await supabase.storage.from(previous.bucket).remove([previous.path]);
    if (result.error)
      throw new Error(
        "The new file was saved, but the previous file could not be removed. Please contact support.",
      );
  }
}
export async function deleteDocument(document: DocumentRecord) {
  check(
    await supabase.rpc("seller_set_document", {
      p_kind: document.kind,
      p_bucket: null,
      p_path: null,
      p_name: null,
      p_mime: null,
      p_size: null,
    }),
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
export async function submitApplication(revision: number, confirm: boolean, terms: boolean) {
  return check(
    await supabase.rpc("seller_submit", {
      p_revision: revision,
      p_confirm: confirm,
      p_terms: terms,
    }),
  );
}
export async function applicationComments(userId: string) {
  return (
    check(
      await supabase
        .from("seller_application_comments")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ) ?? []
  );
}

export async function sellerReceipt(userId: string) {
  const [application, store] = await Promise.all([
    supabase
      .from("seller_onboarding")
      .select("id,submitted_at")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("seller_stores").select("id").eq("user_id", userId).maybeSingle(),
  ]);
  return { sellerId: userId, application: check(application), store: check(store) };
}
