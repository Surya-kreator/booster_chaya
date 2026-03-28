const STORAGE_KEY = "booster-chaya-review-tokens"

export function getReviewTokens(): Record<string, string> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {}
    return parsed as Record<string, string>
  } catch {
    return {}
  }
}

export function setReviewToken(reviewId: string, token: string) {
  const next = { ...getReviewTokens(), [reviewId]: token }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}

export function removeReviewToken(reviewId: string) {
  const next = { ...getReviewTokens() }
  delete next[reviewId]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
}
