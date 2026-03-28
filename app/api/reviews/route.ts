import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import type { PublicReview, StoredReview } from "@/lib/reviews"
import { createEditToken } from "@/lib/review-tokens"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DATA_PATH = path.join(process.cwd(), "data", "reviews.json")

function toPublic(review: StoredReview | (PublicReview & { editToken?: string })): PublicReview {
  const { id, name, rating, content, createdAt } = review
  return { id, name, rating, content, createdAt }
}

async function readReviews(): Promise<StoredReview[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8")
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as StoredReview[]
  } catch {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true })
    await fs.writeFile(DATA_PATH, "[]", "utf-8")
    return []
  }
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

export async function GET() {
  try {
    const reviews = await readReviews()
    const sorted = [...reviews].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    return NextResponse.json(sorted.map(toPublic))
  } catch {
    return NextResponse.json({ error: "Could not load reviews." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 })
    }

    const validated = validateReview(body)
    if (!validated.ok) {
      return NextResponse.json({ error: validated.message }, { status: 400 })
    }

    const reviews = await readReviews()
    const editToken = createEditToken()
    const review: StoredReview = {
      id: crypto.randomUUID(),
      ...validated.data,
      createdAt: new Date().toISOString(),
      editToken,
    }

    reviews.unshift(review)
    await fs.writeFile(DATA_PATH, JSON.stringify(reviews, null, 2), "utf-8")

    return NextResponse.json(
      {
        ...toPublic(review),
        editToken,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: "Could not save review." }, { status: 500 })
  }
}
