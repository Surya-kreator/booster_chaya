import { NIGHT_END_HOUR, NIGHT_START_HOUR } from "./constants"

/** True when local time is in the “closed” display window (no DB writes). */
export function isNightMenuClosed(now = new Date()): boolean {
  const h = now.getHours()
  const start = NIGHT_START_HOUR
  const end = NIGHT_END_HOUR
  // Same calendar-day window (e.g. 9–17)
  if (start < end) {
    return h >= start && h < end
  }
  // Wraps midnight (e.g. 22–06)
  return h >= start || h < end
}

/** Effective availability for UI (DB value AND not forced “closed” at night). */
export function getEffectiveAvailable(
  dbAvailable: boolean,
  now = new Date(),
): boolean {
  if (isNightMenuClosed(now)) return false
  return dbAvailable
}
