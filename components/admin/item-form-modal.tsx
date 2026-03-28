"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, ImageIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import { PLACEHOLDER_MENU_IMAGE } from "./constants"
import type { AdminCategory, AdminMenuItem, ItemFormValues } from "./types"

type ItemFormModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: "add" | "edit"
  item: AdminMenuItem | null
  categories: AdminCategory[]
  saving: boolean
  onSubmit: (values: ItemFormValues) => Promise<void>
}

export function ItemFormModal({
  open,
  onOpenChange,
  mode,
  item,
  categories,
  saving,
  onSubmit,
}: ItemFormModalProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [available, setAvailable] = useState(true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  function clearObjectUrl() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  useEffect(() => {
    if (!open) return

    clearObjectUrl()
    setImageFile(null)

    if (mode === "edit" && item) {
      setName(item.name)
      setDescription(item.description ?? "")
      setPrice(String(item.price))
      setCategoryId(String(item.category))
      setAvailable(item.available)
      setPreviewUrl(item.image_url?.trim() || null)
    } else {
      setName("")
      setDescription("")
      setPrice("")
      setCategoryId(categories[0] ? String(categories[0].id) : "")
      setAvailable(true)
      setPreviewUrl(null)
    }
  }, [open, mode, item, categories])

  useEffect(() => {
    return () => {
      clearObjectUrl()
    }
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    clearObjectUrl()

    if (!file) {
      setImageFile(null)
      if (mode === "edit" && item?.image_url?.trim()) {
        setPreviewUrl(item.image_url.trim())
      } else {
        setPreviewUrl(null)
      }
      return
    }

    setImageFile(file)
    const url = URL.createObjectURL(file)
    objectUrlRef.current = url
    setPreviewUrl(url)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = parseFloat(price)
    if (!name.trim() || Number.isNaN(parsed) || !categoryId) return

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      price: parsed,
      categoryId: Number(categoryId),
      available,
      imageFile,
    })
  }

  const displayImage = previewUrl?.trim() || PLACEHOLDER_MENU_IMAGE
  const canSave =
    name.trim().length > 0 &&
    !Number.isNaN(parseFloat(price)) &&
    categoryId !== "" &&
    !saving

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className={cn(
          "flex max-h-[min(92vh,840px)] w-[calc(100vw-1.25rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:w-full",
        )}
      >
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-6">
          <DialogTitle className="font-serif text-xl">
            {mode === "edit" ? "Edit menu item" : "Add menu item"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="space-y-2">
              <Label htmlFor="admin-item-name">Name</Label>
              <Input
                id="admin-item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mango Booster"
                required
                autoComplete="off"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-item-desc">Description</Label>
              <Textarea
                id="admin-item-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-item-price">Price (₹)</Label>
              <Input
                id="admin-item-price"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.01}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="admin-item-category">Category</Label>
              <select
                id="admin-item-category"
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                  "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                disabled={categories.length === 0}
              >
                {categories.length === 0 ? (
                  <option value="">No categories — add one first</option>
                ) : (
                  categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Image</Label>
              <div className="overflow-hidden rounded-xl border border-border bg-muted/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={displayImage}
                  alt=""
                  className="aspect-video w-full object-cover"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  <ImageIcon className="size-4" />
                  Gallery / file
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2 sm:hidden"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="size-4" />
                  Camera
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Preview updates before upload. On save, the image is uploaded to
                storage and the public URL is stored on the item.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="admin-item-available" className="text-base">
                  Available
                </Label>
                <p className="text-xs text-muted-foreground">
                  Hidden items won’t show on the public menu.
                </p>
              </div>
              <Switch
                id="admin-item-available"
                checked={available}
                onCheckedChange={setAvailable}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border px-4 py-4 sm:flex-row sm:px-6">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={saving}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={!canSave}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
