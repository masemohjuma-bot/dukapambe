import { supabase } from "@/integrations/supabase/client";
import { validateUpload } from "@/lib/seller/model";
export const BUYER_AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export async function uploadBuyerAvatar(file: File) {
  if (file.size > BUYER_AVATAR_MAX_BYTES)
    throw new Error("Buyer profile images must be no larger than 2 MB.");
  await validateUpload(file, true);
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("Sign in to upload your profile image.");
  const profile = await supabase
    .from("buyer_profiles")
    .select("user_id,avatar_path")
    .eq("user_id", data.user.id)
    .single();
  if (profile.error) throw profile.error;
  const path = `${data.user.id}/${crypto.randomUUID()}.${file.type === "image/png" ? "png" : "jpg"}`;
  const result = await supabase.storage
    .from("buyer-profile-images")
    .upload(path, file, { upsert: false, contentType: file.type });
  if (result.error) throw result.error;
  // Stores a private object path, never a public identity-image URL.
  const saved = await supabase
    .from("buyer_profiles")
    .update({ avatar_path: path })
    .eq("user_id", data.user.id)
    .select("avatar_path")
    .single();
  if (saved.error) {
    await supabase.storage.from("buyer-profile-images").remove([path]);
    throw saved.error;
  }
  if (profile.data?.avatar_path) {
    const cleanup = await supabase.storage
      .from("buyer-profile-images")
      .remove([profile.data.avatar_path]);
    if (cleanup.error)
      throw new Error(
        "The new profile image was saved, but the previous image could not be removed. Please contact support.",
      );
  }
  return path;
}
export async function previewBuyerAvatar(path: string) {
  const result = await supabase.storage.from("buyer-profile-images").createSignedUrl(path, 60);
  if (result.error) throw result.error;
  if (!result.data) throw new Error("Profile image preview unavailable.");
  return result.data.signedUrl;
}
