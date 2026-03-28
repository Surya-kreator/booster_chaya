"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"

const PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=400&q=80"

type CategoryEmbed = { id: number; name: string | null }

type MenuItemRow = {
  id: string | number
  name: string | null
  description: string | null
  price: string | number | null
  image_url: string | null
  /** PostgREST / Supabase types may infer this as an array even for many-to-one embeds */
  category: CategoryEmbed | CategoryEmbed[] | null
}

type MenuItemDisplay = {
  id: string | number
  name: string
  description: string
  price: string
  category: string
  image: string
  badge?: string
}

function formatPrice(price: string | number | null | undefined): string {
  if (price == null) return ""
  if (typeof price === "string") return price
  if (typeof price === "number" && !Number.isNaN(price)) {
    return `₹${price.toFixed(2)}`
  }
  return String(price)
}

function resolveCategory(
  c: MenuItemRow["category"],
): CategoryEmbed | null {
  if (c == null) return null
  return Array.isArray(c) ? (c[0] ?? null) : c
}

function mapMenuRow(row: MenuItemRow): MenuItemDisplay | null {
  const name = row.name?.trim()
  if (!name) return null
  const category = resolveCategory(row.category)
  const categoryName = category?.name?.trim()
  if (!category || !categoryName) return null
  const image = row.image_url?.trim()
  return {
    id: row.id,
    name,
    description: row.description?.trim() ?? "",
    price: formatPrice(row.price),
    category: categoryName,
    image: image || PLACEHOLDER_IMAGE,
  }
}

export function MenuSection() {
  const [categories, setCategories] = useState<string[]>(["All"])
  const [menuItems, setMenuItems] = useState<MenuItemDisplay[]>([])
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)

      const [catResult, itemsResult] = await Promise.all([
        supabase.from("categories").select("id, name").order("name"),
        supabase
          .from("menu_items")
          .select(
            `
            id,
            name,
            description,
            price,
            image_url,
            category:categories!menu_items_category_fkey ( id, name )
          `,
          )
          .order("name"),
      ])

      if (cancelled) return

      if (catResult.error) {
        console.error(catResult.error)
      }
      if (itemsResult.error) {
        console.error(itemsResult.error)
      }

      const catRows = catResult.data ?? []
      const names = catRows
        .map((c) => c.name?.trim())
        .filter((n): n is string => Boolean(n))

      setCategories(["All", ...names])

      const rows = (itemsResult.data ?? []) as MenuItemRow[]
      const items = rows
        .map(mapMenuRow)
        .filter((item): item is MenuItemDisplay => item !== null)

      setMenuItems(items)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const filteredItems = useMemo(() => {
    if (selectedCategory === "All") return menuItems
    return menuItems.filter((item) => item.category === selectedCategory)
  }, [menuItems, selectedCategory])

  return (
    <section id="menu" className="py-24 relative">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-primary text-sm tracking-[0.3em] uppercase mb-4">
            Our Selection
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance">
            Booster Chaya Menu
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty">
            Explore our full premium cafe collection: frappies, Korean bites, ice versions,
            bubble drinks, and hot favorites.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        {loading ? (
          <p className="text-center text-muted-foreground py-16">Loading menu...</p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className="group relative rounded-2xl overflow-hidden bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] hover:border-primary/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              {/* Image */}
              <div className="relative h-56 overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
                
                  {item.badge ? (
                  <span className="absolute top-4 right-4 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
                    {item.badge}
                  </span>
                  ) : null}
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                    {item.name}
                  </h3>
                  <span className="text-primary font-semibold text-lg">
                    {item.price}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {item.description}
                </p>
                <a
                  href="https://wa.me/919843386594?text=Hello! can%20we%20discuss%20about%20my%20Business%20for%20building%20my%20website?"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 text-center bg-secondary/50 text-foreground rounded-xl text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                >
                  Order on WhatsApp
                </a>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
    </section>
  )
}
