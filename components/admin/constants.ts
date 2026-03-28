/** Supabase Storage bucket for menu photos (create as public in dashboard if missing). */
export const MENU_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_MENU_IMAGES_BUCKET ?? "menu-images"

export const PLACEHOLDER_MENU_IMAGE =
  "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80"

/** Night window: items appear unavailable in UI only (22:00–06:00 local). */
export const NIGHT_START_HOUR: number = 22
export const NIGHT_END_HOUR: number = 6
