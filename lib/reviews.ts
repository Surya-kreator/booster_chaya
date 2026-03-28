/** Shipped to the client (GET /api/reviews) — never includes editToken */
export type PublicReview = {
  id: string
  name: string
  rating: number
  content: string
  createdAt: string
}

/** Stored in data/reviews.json */
export type StoredReview = PublicReview & {
  editToken: string
}

/** Response right after creating a review (client must save editToken). */
export type CreatedReviewResponse = PublicReview & {
  editToken: string
}
