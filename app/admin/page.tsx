"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { LayoutGrid, Tag } from "lucide-react"
import { Toaster, toast } from "sonner"

import { FloatingButton } from "@/components/admin/floating-add-button"
import { ItemFormModal } from "@/components/admin/item-form-modal"
import { MenuItemCard } from "@/components/admin/menu-item-card"
import {
  getEffectiveAvailable,
  isNightMenuClosed,
} from "@/components/admin/night-hours"
import type {
  AdminCategory,
  AdminMenuItem,
  ItemFormValues,
} from "@/components/admin/types"
import { uploadMenuImage } from "@/components/admin/upload-menu-image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { supabase } from "@/lib/supabase"

function normalizeMenuItem(row: Record<string, unknown>): AdminMenuItem {
  const priceRaw = row.price
  const price =
    typeof priceRaw === "number" ? priceRaw : Number(priceRaw)
  const cat = row.category
  return {
    id: row.id as number | string,
    name: String(row.name ?? ""),
    description:
      row.description != null && String(row.description).trim() !== ""
        ? String(row.description)
        : null,
    image_url:
      row.image_url != null && String(row.image_url).trim() !== ""
        ? String(row.image_url)
        : null,
    price: Number.isFinite(price) ? price : 0,
    available: row.available !== false,
    category: typeof cat === "number" ? cat : Number(cat),
  }
}

export default function AdminPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [items, setItems] = useState<AdminMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<"add" | "edit">("add")
  const [editingItem, setEditingItem] = useState<AdminMenuItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [nowTick, setNowTick] = useState(() => new Date())

  const nightClosed = useMemo(() => isNightMenuClosed(nowTick), [nowTick])

  useEffect(() => {
    const id = setInterval(() => setNowTick(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const categoryLabel = useMemo(() => {
    const m = new Map<number, string>()
    for (const c of categories) {
      m.set(Number(c.id), c.name)
    }
    return m
  }, [categories])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: catData, error: catErr } = await supabase
        .from("categories")
        .select("*")
        .order("name")
      const { data: itemData, error: itemErr } = await supabase
        .from("menu_items")
        .select("*")
        .order("name")

      if (catErr) {
        console.error(catErr)
        toast.error("Could not load categories")
      }
      if (itemErr) {
        console.error(itemErr)
        toast.error("Could not load menu items")
      }

      setCategories((catData as AdminCategory[]) ?? [])
      setItems(
        (itemData as Record<string, unknown>[] | null)?.map(normalizeMenuItem) ??
          [],
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function addCategory() {
    if (!newCategory.trim()) return
    const { error } = await supabase
      .from("categories")
      .insert({ name: newCategory.trim() })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Category added")
    setNewCategory("")
    await loadData()
  }

  async function resolveImageUrl(
    file: File | null,
    existing: string | null,
  ): Promise<string | null> {
    if (!file) return existing
    const { url, error } = await uploadMenuImage(file)
    if (error || !url) {
      throw new Error(error ?? "Image upload failed")
    }
    return url
  }

  async function handleFormSubmit(values: ItemFormValues) {
    setSaving(true)
    try {
      const existingItem = formMode === "edit" ? editingItem : null
      let imageUrl: string | null = existingItem?.image_url?.trim() ?? null

      if (values.imageFile) {
        imageUrl = await resolveImageUrl(values.imageFile, imageUrl)
      }

      if (formMode === "add") {
        const { error } = await supabase.from("menu_items").insert({
          name: values.name,
          description: values.description || null,
          price: values.price,
          category: values.categoryId,
          available: values.available,
          image_url: imageUrl,
        })
        if (error) throw new Error(error.message)
        toast.success("Item added")
      } else if (existingItem) {
        const { error } = await supabase
          .from("menu_items")
          .update({
            name: values.name,
            description: values.description || null,
            price: values.price,
            category: values.categoryId,
            available: values.available,
            image_url: imageUrl,
          })
          .eq("id", existingItem.id)
        if (error) throw new Error(error.message)
        toast.success("Item updated")
      }

      setFormOpen(false)
      setEditingItem(null)
      await loadData()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  async function deleteItem(item: AdminMenuItem) {
    if (!confirm(`Delete “${item.name}”?`)) return
    const { error } = await supabase
      .from("menu_items")
      .delete()
      .eq("id", item.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Item deleted")
    await loadData()
  }

  async function setAvailability(item: AdminMenuItem, available: boolean) {
    if (item.available === available) return
    const { error } = await supabase
      .from("menu_items")
      .update({ available })
      .eq("id", item.id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(available ? "Item is available" : "Item hidden")
    await loadData()
  }

  async function duplicateItem(item: AdminMenuItem) {
    const { error } = await supabase.from("menu_items").insert({
      name: `${item.name} (Copy)`,
      description: item.description,
      price: item.price,
      category: item.category,
      available: item.available,
      image_url: item.image_url,
    })
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Item duplicated")
    await loadData()
  }

  function openAdd() {
    setFormMode("add")
    setEditingItem(null)
    setFormOpen(true)
  }

  function openEdit(item: AdminMenuItem) {
    setFormMode("edit")
    setEditingItem(item)
    setFormOpen(true)
  }

  return (
    <div className="min-h-svh bg-background pb-28 pt-4 sm:pb-24 sm:pt-6">
      <Toaster richColors position="top-center" theme="dark" closeButton />

      <div className="mx-auto max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            Booster Chaya
          </p>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Menu admin
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage categories and menu items. Changes sync to Supabase.
          </p>
        </header>

        {nightClosed ? (
          <div
            className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-sm"
            role="status"
          >
            <strong className="font-semibold text-amber-50">Nightly display</strong>
            : 10 PM–6 AM items appear unavailable here only. Your saved availability
            in the database is unchanged; the toggle unlocks after 6 AM.
          </div>
        ) : null}

        {/* Categories — same CRUD as before */}
        <section
          className="rounded-2xl border border-border bg-card/40 p-4 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md sm:p-6"
          aria-labelledby="admin-categories-heading"
        >
          <div className="mb-4 flex items-center gap-2">
            <Tag className="size-5 text-primary" />
            <h2
              id="admin-categories-heading"
              className="font-serif text-xl font-semibold text-foreground"
            >
              Categories
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="New category name"
              className="h-11 flex-1 bg-background/80"
              onKeyDown={(e) => {
                if (e.key === "Enter") void addCategory()
              }}
            />
            <Button
              type="button"
              className="h-11 shrink-0 transition-transform active:scale-[0.98]"
              onClick={() => void addCategory()}
            >
              Add category
            </Button>
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.length === 0 && !loading ? (
              <li className="text-sm text-muted-foreground">No categories yet.</li>
            ) : (
              categories.map((c) => (
                <li
                  key={c.id}
                  className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  {c.name}
                </li>
              ))
            )}
          </ul>
        </section>

        {/* Menu items */}
        <section aria-labelledby="admin-items-heading">
          <div className="mb-4 flex items-center gap-2">
            <LayoutGrid className="size-5 text-primary" />
            <h2
              id="admin-items-heading"
              className="font-serif text-xl font-semibold text-foreground"
            >
              Menu items
            </h2>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-16 text-center">
              <p className="font-medium text-foreground">No menu items yet</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Tap the + button to add your first item, or add categories above
                first.
              </p>
              <Button type="button" className="mt-6" onClick={openAdd}>
                Add item
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <MenuItemCard
                  key={String(item.id)}
                  item={item}
                  categoryLabel={
                    categoryLabel.get(Number(item.category)) ?? "Unknown"
                  }
                  effectiveAvailable={getEffectiveAvailable(
                    item.available,
                    nowTick,
                  )}
                  nightClosed={nightClosed}
                  onToggle={(it, next) => void setAvailability(it, next)}
                  onDelete={(it) => void deleteItem(it)}
                  onDuplicate={(it) => void duplicateItem(it)}
                  onEdit={openEdit}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <FloatingButton onClick={openAdd} />

      <ItemFormModal
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) setEditingItem(null)
        }}
        mode={formMode}
        item={editingItem}
        categories={categories}
        saving={saving}
        onSubmit={async (values) => {
          await handleFormSubmit(values)
        }}
      />
    </div>
  )
}
