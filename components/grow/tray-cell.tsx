"use client"

import { cn } from "@/lib/utils"
import { type TrayView, type GrowthPhase, GROWTH_PHASE_LABELS } from "@/lib/api"
import { PlusIcon, TagIcon } from "lucide-react"
import { StrainAvatar } from "./strain-avatar"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card"

const PHASE_COLORS: Record<GrowthPhase, string> = {
  immature: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  vegetative: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  flowering: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

interface TrayCellProps {
  tray: TrayView
  isSelected: boolean
  isMoveTarget: boolean
  onClick: () => void
}

export function TrayCell({ tray, isSelected, isMoveTarget, onClick }: TrayCellProps) {
  const isEmpty = tray.plants.length === 0
  const isFull = tray.plants.length >= tray.capacity
  const occupancy = tray.plants.length

  // Count plants by phase
  const phaseCounts: Partial<Record<GrowthPhase, number>> = {}
  for (const p of tray.plants) {
    phaseCounts[p.growth_phase] = (phaseCounts[p.growth_phase] || 0) + 1
  }

  // Unique strain names
  const uniqueStrains = [...new Set(tray.plants.map((p) => p.strain_name))]
  const singleStrain = uniqueStrains.length === 1 ? uniqueStrains[0] : null

  const cell = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-md border p-2 transition-all",
        "h-[96px] w-[110px] text-xs",
        isEmpty && "border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 hover:bg-muted/50",
        !isEmpty && !isFull && "border-border bg-card hover:bg-accent/50",
        isFull && "border-border bg-muted/50",
        isSelected && "ring-primary ring-2 ring-offset-1",
        isMoveTarget && "border-primary bg-primary/5 border-dashed border-2"
      )}
    >
      {isEmpty ? (
        <div className="flex flex-col items-center gap-1">
          <PlusIcon className="text-muted-foreground/40 h-4 w-4" />
          <span className="text-muted-foreground/50 text-[10px] tabular-nums">0/{tray.capacity}</span>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          {/* Avatars */}
          <div className="flex shrink-0 -space-x-2">
            {uniqueStrains.slice(0, 3).map((name) => (
              <StrainAvatar key={name} name={name} size={30} />
            ))}
            {uniqueStrains.length > 3 && (
              <div className="bg-muted text-muted-foreground flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border text-[10px] font-medium">
                +{uniqueStrains.length - 3}
              </div>
            )}
          </div>
          {/* Strain name if all same, otherwise capacity */}
          {singleStrain ? (
            <span className="text-muted-foreground max-w-full truncate text-[11px]">{singleStrain}</span>
          ) : (
            <span className="text-muted-foreground text-[11px] tabular-nums">{occupancy}/{tray.capacity}</span>
          )}
          {/* Phase dots */}
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
      )}
      {!isFull && !isEmpty && (
        <PlusIcon className="text-muted-foreground/30 absolute right-0.5 top-0.5 h-3 w-3" />
      )}
    </button>
  )

  if (isEmpty) return cell

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>{cell}</HoverCardTrigger>
      <HoverCardContent side="top" className="w-56 p-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">{tray.name || `Tray ${tray.position + 1}`}</span>
            <span className="text-muted-foreground text-xs tabular-nums">{occupancy}/{tray.capacity}</span>
          </div>
          <div className="space-y-1.5">
            {tray.plants.map((plant) => (
              <div key={plant.id} className="flex items-center gap-1.5">
                <StrainAvatar name={plant.strain_name} size={18} />
                <span className="min-w-0 flex-1 truncate text-xs">{plant.strain_name}</span>
                <span
                  className={cn(
                    "shrink-0 rounded px-1 py-0.5 text-[9px] font-medium leading-none",
                    PHASE_COLORS[plant.growth_phase]
                  )}
                >
                  {GROWTH_PHASE_LABELS[plant.growth_phase]}
                </span>
              </div>
            ))}
          </div>
          {tray.plants.some((p) => p.metrc_label) && (
            <div className="border-t pt-1.5 space-y-0.5">
              {tray.plants.filter((p) => p.metrc_label).map((p) => (
                <div key={p.id} className="text-muted-foreground flex items-center gap-1 text-[10px]">
                  <TagIcon className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate font-mono">{p.metrc_label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
