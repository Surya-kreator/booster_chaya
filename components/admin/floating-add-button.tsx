"use client"

import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type FloatingButtonProps = {
  onClick: () => void
  className?: string
  "aria-label"?: string
}

/** FAB (+) to open add-item flow. */
export function FloatingButton({
  onClick,
  className,
  "aria-label": ariaLabel = "Add menu item",
}: FloatingButtonProps) {
  return (
    <Button
      type="button"
      size="icon-lg"
      className={cn(
        "fixed bottom-6 right-4 z-50 size-14 rounded-full shadow-lg shadow-primary/25",
        "transition-transform duration-200 hover:scale-105 active:scale-95",
        "sm:bottom-8 sm:right-6",
        className,
      )}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      <Plus className="size-7" strokeWidth={2.5} />
    </Button>
  )
}
