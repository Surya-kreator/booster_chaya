import { randomBytes, timingSafeEqual } from "crypto"

export function createEditToken(): string {
  return randomBytes(32).toString("hex")
}

export function tokensEqual(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, "utf8")
    const bb = Buffer.from(b, "utf8")
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}
