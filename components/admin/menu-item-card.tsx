"use client"

import { Copy, Pencil, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import { PLACEHOLDER_MENU_IMAGE } from "./constants"
import type { AdminMenuItem } from "./types"

type MenuItemCardProps = {
  item: AdminMenuItem
  categoryLabel: string
  effectiveAvailable: boolean
  nightClosed: boolean
  onToggle: (item: AdminMenuItem, available: boolean) => void
  onEdit: (item: AdminMenuItem) => void
  onDelete: (item: AdminMenuItem) => void
  onDuplicate: (item: AdminMenuItem) => void
}

export function MenuItemCard({
  item,
  categoryLabel,
  effectiveAvailable,
  nightClosed,
  onToggle,
  onEdit,
  onDelete,
  onDuplicate,
}: MenuItemCardProps) {
  const imgSrc = item.image_url?.trim() || PLACEHOLDER_MENU_IMAGE

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm",
        "transition-all duration-200 hover:shadow-md hover:shadow-primary/5",
        "hover:-translate-y-0.5",
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-serif text-lg font-semibold leading-tight text-foreground">
              {item.name}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.description?.trim() || "—"}
            </p>
          </div>
          <p className="shrink-0 text-lg font-semibold text-primary">
            ₹{Number(item.price).toFixed(2)}
          </p>
        </div>

        <span className="inline-flex w-fit max-w-full truncate rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {categoryLabel}
        </span>

        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span className="text-xs text-muted-foreground">Available</span>
            <Switch
              checked={effectiveAvailable}
              disabled={nightClosed}
              onCheckedChange={(checked) => {
                if (nightClosed) return
                onToggle(item, checked)
              }}
              aria-label={`Availability for ${item.name}`}
            />
            {nightClosed ? (
              <p className="text-[11px] leading-snug text-muted-foreground">
                Nightly pause (10 PM–6 AM). Toggle unlocks automatically.
              </p>
            ) : null}
          </div>
          <div className="flex shrink-0 gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="transition-colors"
              onClick={() => onDuplicate(item)}
              aria-label={`Duplicate ${item.name}`}
            >
              <Copy className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.name}`}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              className="bg-destructive/90"
              onClick={() => onDelete(item)}
              aria-label={`Delete ${item.name}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
