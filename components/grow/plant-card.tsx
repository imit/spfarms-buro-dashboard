"use client"

import { cn } from "@/lib/utils"
import { type GrowthPhase } from "@/lib/api"
import { StrainAvatar } from "./strain-avatar"
import { PhaseBadge } from "./phase-badge"
import { TagIcon, MapPinIcon } from "lucide-react"

interface PlantCardProps {
  strainName: string
  plantUid: string
  growthPhase: GrowthPhase
  metrcLabel?: string | null
  roomName?: string | null
  rackName?: string | null
  trayName?: string | null
  variant?: "default" | "compact"
  isSelected?: boolean
  onClick?: () => void
  actions?: React.ReactNode
}

export function PlantCard({
  strainName,
  plantUid,
  growthPhase,
  metrcLabel,
  roomName,
  rackName,
  trayName,
  variant = "default",
  isSelected = false,
  onClick,
  actions,
}: PlantCardProps) {
  const locationParts = [roomName, rackName, trayName].filter(Boolean)

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5">
        <StrainAvatar name={strainName} size={18} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-xs font-medium">{strainName}</span>
            <PhaseBadge phase={growthPhase} />
          </div>
          <p className="text-muted-foreground truncate font-mono text-[10px]">{plantUid}</p>
        </div>
        {metrcLabel && (
          <div className="text-muted-foreground flex shrink-0 items-center gap-0.5 text-[10px]">
            <TagIcon className="h-2.5 w-2.5" />
            <span className="font-mono">{metrcLabel}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
        onClick && "cursor-pointer"
      )}
    >
      <div onClick={onClick}>
        <div className="flex items-start gap-2.5">
          <StrainAvatar name={strainName} size={32} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-medium text-sm">{strainName}</p>
              <PhaseBadge phase={growthPhase} />
            </div>
            <p className="text-muted-foreground font-mono text-xs">{plantUid}</p>
          </div>
        </div>
        {locationParts.length > 0 && (
          <div className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
            <MapPinIcon className="h-3 w-3 shrink-0" />
            <span className="truncate">{locationParts.join(" > ")}</span>
          </div>
        )}
        {metrcLabel && (
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            <TagIcon className="h-3 w-3 shrink-0" />
            <span className="font-mono">{metrcLabel}</span>
          </div>
        )}
      </div>
      {isSelected && actions && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
          {actions}
        </div>
      )}
    </div>
  )
}
