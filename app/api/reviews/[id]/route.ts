import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import type { PublicReview, StoredReview } from "@/lib/reviews"
import { tokensEqual } from "@/lib/review-tokens"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DATA_PATH = path.join(process.cwd(), "data", "reviews.json")

function toPublic(review: StoredReview): PublicReview {
  const { id, name, rating, content, createdAt } = review
  return { id, name, rating, content, createdAt }
}

async function readReviews(): Promise<StoredReview[]> {
  const raw = await fs.readFile(DATA_PATH, "utf-8")
  const parsed = JSON.parse(raw) as unknown
  if (!Array.isArray(parsed)) return []
  return parsed as StoredReview[]
}

async function writeReviews(reviews: StoredReview[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(reviews, null, 2), "utf-8")
}

function validateReview(body: unknown): {
  ok: true
  data: Pick<StoredReview, "name" | "rating" | "content">
} | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "Invalid request body." }
  }
  const { name, rating, content } = body as Record<string, unknown>

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 60) {
    return { ok: false, message: "Name must be between 2 and 60 characters." }
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, message: "Rating must be a whole number from 1 to 5." }
  }
  if (typeof content !== "string" || content.trim().length < 10 || content.trim().length > 500) {
    return { ok: false, message: "Review must be between 10 and 500 characters." }
  }

  return {
    ok: true,
    data: {
      name: name.trim(),
      rating,
      content: content.trim(),
    },
  }
}

type RouteParams = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }

    const { editToken } = body as Record<string, unknown>
    if (typeof editToken !== "string" || editToken.length < 16) {
      return NextResponse.json({ error: "Missing or invalid edit token." }, { status: 400 })
    }

    const validated = validateReview(body)
    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 })
    }

    const reviews = await readReviews()
    const index = reviews.findIndex((r) => r.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 })
    }

    const existing = reviews[index]
    if (!existing.editToken || !tokensEqual(editToken, existing.editToken)) {
      return NextResponse.json({ error: "Not allowed to edit this review." }, { status: 403 })
    }

    const updated: StoredReview = {
      ...existing,
      ...validated.data,
      id: existing.id,
      createdAt: existing.createdAt,
      editToken: existing.editToken,
    }
    reviews[index] = updated
    await writeReviews(reviews)

    return NextResponse.json(toPublic(updated))
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Review not found." }, { status: 404 })
    }
    return NextResponse.json({ error: "Could not update review." }, { status: 500 })
  }
}

export async function DELETE(request: Request, props: RouteParams) {
  try {
    const { id } = await props.params

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 })
    }

    const { editToken } = body as Record<string, unknown>
    if (typeof editToken !== "string" || editToken.length < 16) {
      return NextResponse.json({ error: "Missing or invalid edit token." }, { status: 400 })
    }

    const reviews = await readReviews()
    const index = reviews.findIndex((r) => r.id === id)
    if (index === -1) {
      return NextResponse.json({ error: "Review not found." }, { status: 404 })
    }

    const existing = reviews[index]
    if (!existing.editToken || !tokensEqual(editToken, existing.editToken)) {
      return NextResponse.json({ error: "Not allowed to delete this review." }, { status: 403 })
    }

    reviews.splice(index, 1)
    await writeReviews(reviews)

    return NextResponse.json({ ok: true })
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "Review not found." }, { status: 404 })
    }
    return NextResponse.json({ error: "Could not delete review." }, { status: 500 })
  }
}
