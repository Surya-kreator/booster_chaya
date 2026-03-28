"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, Pencil, Quote, Send, Star, Trash2, X } from "lucide-react"
import type { PublicReview } from "@/lib/reviews"
import {
  getReviewTokens,
  removeReviewToken,
  setReviewToken,
} from "@/lib/client-review-tokens"

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10 text-sm font-semibold text-primary"
      aria-hidden
    >
      {initials || "?"}
    </div>
  )
}

function StarRow({
  rating,
  interactive,
  onChange,
}: {
  rating: number
  interactive?: boolean
  onChange?: (n: number) => void
}) {
  if (!interactive) {
    return (
      <div
        className="flex gap-1"
        role="img"
        aria-label={`${rating} out of 5 stars`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`h-4 w-4 ${
              n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
            }`}
            aria-hidden
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-1" role="group" aria-label="Star rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`Rate ${n} out of 5`}
          aria-pressed={rating === n}
          className="rounded p-0.5 transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          onClick={() => onChange?.(n)}
        >
          <Star
            className={`h-4 w-4 ${
              n <= rating ? "fill-primary text-primary" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

type CreatedReviewPayload = PublicReview & { editToken: string }

export function ReviewsSection() {
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [tokenMap, setTokenMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitOk, setSubmitOk] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editRating, setEditRating] = useState(5)
  const [editContent, setEditContent] = useState("")
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const refreshTokenMap = useCallback(() => {
    setTokenMap(getReviewTokens())
  }, [])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" })
      if (!res.ok) throw new Error("Failed to load")
      const data = (await res.json()) as PublicReview[]
      setReviews(Array.isArray(data) ? data : [])
    } catch {
      setLoadError("Could not load reviews. Please refresh the page.")
      setReviews([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshTokenMap()
    void fetchReviews()
  }, [fetchReviews, refreshTokenMap])

  function startEdit(r: PublicReview) {
    setEditingId(r.id)
    setEditName(r.name)
    setEditRating(r.rating)
    setEditContent(r.content)
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  async function saveEdit(reviewId: string) {
    const editToken = tokenMap[reviewId]
    if (!editToken) {
      setEditError("You can only edit reviews posted from this browser.")
      return
    }
    setEditSaving(true)
    setEditError(null)
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          editToken,
          name: editName.trim(),
          rating: editRating,
          content: editContent.trim(),
        }),
      })
      const data = (await res.json()) as { error?: string } & Partial<PublicReview>
      if (!res.ok) {
        setEditError(data.error ?? "Could not update review.")
        return
      }
      if (data.id) {
        setReviews((prev) => prev.map((x) => (x.id === reviewId ? (data as PublicReview) : x)))
      }
      setEditingId(null)
    } catch {
      setEditError("Network error. Try again.")
    } finally {
      setEditSaving(false)
    }
  }

  async function removeReview(reviewId: string) {
    const editToken = tokenMap[reviewId]
    if (!editToken) return
    if (!window.confirm("Delete this review permanently?")) return

    setDeletingId(reviewId)
    try {
      const res = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ editToken }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        alert(data.error ?? "Could not delete review.")
        return
      }
      removeReviewToken(reviewId)
      refreshTokenMap()
      setReviews((prev) => prev.filter((x) => x.id !== reviewId))
      if (editingId === reviewId) setEditingId(null)
    } catch {
      alert("Network error. Try again.")
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    setSubmitOk(false)
    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          rating,
          content: content.trim(),
        }),
      })
      const data = (await res.json()) as { error?: string } & Partial<CreatedReviewPayload>

      if (!res.ok) {
        setSubmitError(data.error ?? "Something went wrong.")
        return
      }

      if (data.id && data.createdAt && data.editToken) {
        const { editToken, ...publicPart } = data as CreatedReviewPayload
        setReviewToken(publicPart.id, editToken)
        refreshTokenMap()
        setReviews((prev) => [publicPart, ...prev])
      } else {
        await fetchReviews()
        refreshTokenMap()
      }

      setName("")
      setContent("")
      setRating(5)
      setSubmitOk(true)
    } catch {
      setSubmitError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="reviews" className="relative overflow-hidden py-24">
      <div className="absolute top-1/2 left-0 h-72 w-72 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute top-1/3 right-0 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="container relative z-10 mx-auto px-6">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Reviews
          </p>
          <h2 className="mb-6 font-serif text-4xl font-bold text-balance text-foreground md:text-5xl">
            Share your experience
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Post a review below — it is saved on this server and listed here for everyone visiting
            the site. Edit or delete only appears for reviews you posted on this device (your browser
            stores a private key).
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-start">
          {/* Form */}
          <div className="rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-8 backdrop-blur-xl">
            <h3 className="mb-6 font-serif text-xl font-semibold text-foreground">
              Write a review
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="review-name" className="mb-2 block text-sm font-medium text-foreground">
                  Your name
                </label>
                <input
                  id="review-name"
                  type="text"
                  required
                  maxLength={60}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="e.g. Priya"
                />
              </div>
              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">Rating</span>
                <StarRow rating={rating} interactive onChange={setRating} />
              </div>
              <div>
                <label htmlFor="review-content" className="mb-2 block text-sm font-medium text-foreground">
                  Your review
                </label>
                <textarea
                  id="review-content"
                  required
                  rows={4}
                  maxLength={500}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full resize-y rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                  placeholder="What did you enjoy? (10–500 characters)"
                />
                <p className="mt-1 text-xs text-muted-foreground">{content.length}/500</p>
              </div>

              {submitError && (
                <p className="text-sm text-destructive" role="alert">
                  {submitError}
                </p>
              )}
              {submitOk && (
                <p className="text-sm text-primary" role="status">
                  Thanks! Your review was posted.
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Post review
                  </>
                )}
              </button>
            </form>
          </div>

          {/* List */}
          <div>
            <h3 className="mb-6 font-serif text-xl font-semibold text-foreground">
              Recent reviews
            </h3>

            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading reviews…
              </div>
            )}

            {!loading && loadError && (
              <p className="text-sm text-destructive">{loadError}</p>
            )}

            {!loading && !loadError && reviews.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border/80 bg-secondary/20 p-8 text-center text-muted-foreground">
                No reviews yet. Be the first to share your visit to Booster Chaya.
              </p>
            )}

            {!loading && !loadError && reviews.length > 0 && (
              <ul className="space-y-4">
                {reviews.map((r, index) => {
                  const canManage = Boolean(tokenMap[r.id])
                  const isEditing = editingId === r.id

                  return (
                    <li
                      key={r.id}
                      className="group relative rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] p-6 backdrop-blur-xl transition-colors hover:border-primary/30"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {!isEditing && (
                        <Quote className="pointer-events-none absolute top-4 left-4 h-8 w-8 text-primary/15" />
                      )}

                      {canManage && !isEditing && (
                        <div className="relative z-10 mb-4 flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(r)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            aria-label="Edit review"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === r.id}
                            onClick={() => void removeReview(r.id)}
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                            aria-label="Delete review"
                          >
                            {deletingId === r.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                              Name
                            </label>
                            <input
                              type="text"
                              maxLength={60}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full rounded-xl border border-border bg-background/80 px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            />
                          </div>
                          <div>
                            <span className="mb-2 block text-sm font-medium text-foreground">
                              Rating
                            </span>
                            <StarRow rating={editRating} interactive onChange={setEditRating} />
                          </div>
                          <div>
                            <label className="mb-2 block text-sm font-medium text-foreground">
                              Review
                            </label>
                            <textarea
                              rows={4}
                              maxLength={500}
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full resize-y rounded-xl border border-border bg-background/80 px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                            />
                            <p className="mt-1 text-xs text-muted-foreground">
                              {editContent.length}/500
                            </p>
                          </div>
                          {editError && (
                            <p className="text-sm text-destructive" role="alert">
                              {editError}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={editSaving}
                              onClick={() => void saveEdit(r.id)}
                              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                            >
                              {editSaving ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : null}
                              Save changes
                            </button>
                            <button
                              type="button"
                              disabled={editSaving}
                              onClick={cancelEdit}
                              className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <StarRow rating={r.rating} />
                          </div>
                          <p className="mb-6 text-pretty leading-relaxed text-foreground/90">
                            &ldquo;{r.content}&rdquo;
                          </p>
                          <div className="flex items-center gap-4">
                            <InitialsAvatar name={r.name} />
                            <div>
                              <p className="font-semibold text-foreground">{r.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(r.createdAt).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
