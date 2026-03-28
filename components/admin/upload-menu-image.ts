import { supabase } from "@/lib/supabase"
import { MENU_IMAGES_BUCKET } from "./constants"

export async function uploadMenuImage(
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg"
  const safeExt = /^[a-z0-9]+$/i.test(ext) ? ext : "jpg"
  const path = `items/${Date.now()}-${crypto.randomUUID()}.${safeExt}`

  const { error } = await supabase.storage
    .from(MENU_IMAGES_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (error) {
    return { url: null, error: error.message }
  }

  const { data } = supabase.storage.from(MENU_IMAGES_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
