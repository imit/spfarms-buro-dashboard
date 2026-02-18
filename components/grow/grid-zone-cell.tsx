"use client"

import { cn } from "@/lib/utils"
import { type GridZone, type GrowthPhase, GROWTH_PHASE_LABELS } from "@/lib/api"
import { PlusIcon, TagIcon } from "lucide-react"

const PHASE_COLORS: Record<GrowthPhase, string> = {
  immature: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  vegetative: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  flowering: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

const PHASE_DOT_COLORS: Record<GrowthPhase, string> = {
  immature: "bg-amber-500",
  vegetative: "bg-green-500",
  flowering: "bg-purple-500",
}

interface GridZoneCellProps {
  zone: GridZone
  isSelected: boolean
  isMoveTarget: boolean
  onClick: () => void
}

export function GridZoneCell({ zone, isSelected, isMoveTarget, onClick }: GridZoneCellProps) {
  const isEmpty = zone.plants.length === 0
  const isFull = zone.plants.length >= zone.capacity
  const occupancy = zone.plants.length
  const singlePlant = zone.plants.length === 1 ? zone.plants[0] : null

  // Count plants by phase
  const phaseCounts: Partial<Record<GrowthPhase, number>> = {}
  for (const p of zone.plants) {
    phaseCounts[p.growth_phase] = (phaseCounts[p.growth_phase] || 0) + 1
  }

  // Unique strain names for multi-plant cells
  const uniqueStrains = [...new Set(zone.plants.map((p) => p.strain_name))]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-start justify-center rounded-md border p-2 transition-all",
        "min-h-[72px] text-xs",
        isEmpty && "border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/50 items-center",
        !isEmpty && !isFull && "border-border bg-card hover:bg-accent/50",
        isFull && "border-border bg-muted/50",
        isSelected && "ring-primary ring-2 ring-offset-1",
        isMoveTarget && "border-primary bg-primary/5 border-dashed border-2"
      )}
    >
      {isEmpty ? (
        <PlusIcon className="text-muted-foreground/40 h-4 w-4" />
      ) : singlePlant ? (
        <div className="flex w-full flex-col gap-1 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="truncate font-medium">{singlePlant.strain_name}</span>
            <span
              className={cn(
                "shrink-0 rounded px-1 py-0.5 text-[10px] font-medium leading-none",
                PHASE_COLORS[singlePlant.growth_phase]
              )}
            >
              {GROWTH_PHASE_LABELS[singlePlant.growth_phase]}
            </span>
          </div>
          {singlePlant.metrc_label && (
            <div className="text-muted-foreground flex items-center gap-0.5 text-[10px]">
              <TagIcon className="h-2.5 w-2.5 shrink-0" />
              <span className="truncate font-mono">{singlePlant.metrc_label}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="flex w-full flex-col gap-1 overflow-hidden">
          <div className="flex items-center justify-between gap-1">
            <span className="font-medium tabular-nums">
              {occupancy}/{zone.capacity}
            </span>
            <div className="flex gap-0.5">
              {(Object.entries(phaseCounts) as [GrowthPhase, number][]).map(([phase, count]) => (
                <span
                  key={phase}
                  className={cn(
                    "rounded px-1 py-0.5 text-[10px] font-medium leading-none",
                    PHASE_COLORS[phase]
                  )}
                >
                  {count}
                </span>
              ))}
            </div>
          </div>
          <span className="text-muted-foreground truncate text-[10px]">
            {uniqueStrains.join(", ")}
          </span>
        </div>
      )}
      {!isFull && !isEmpty && (
        <PlusIcon className="text-muted-foreground/30 absolute right-0.5 top-0.5 h-3 w-3" />
      )}
    </button>
  )
}
