import { supabase } from "@/integrations/supabase/client";

export async function uploadImage(file: File, prefix = "misc"): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}
