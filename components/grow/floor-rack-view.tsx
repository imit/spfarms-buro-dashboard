"use client"

import { type FloorView, type TrayView } from "@/lib/api"
import { TrayCell } from "./tray-cell"

interface FloorRackViewProps {
  floorView: FloorView
  selectedPlantId: number | null
  selectedTrayId: number | null
  onSelectTray: (tray: TrayView, rackName: string) => void
  onPlacePlant: (trayId: number) => void
  onMovePlant: (targetTrayId: number) => void
  movingPlantId: number | null
}

export function FloorRackView({
  floorView,
  selectedPlantId,
  selectedTrayId,
  onSelectTray,
  onPlacePlant,
  onMovePlant,
  movingPlantId,
}: FloorRackViewProps) {
  const handleTrayClick = (tray: TrayView, rackName: string) => {
    if (movingPlantId) {
      onMovePlant(tray.id)
      return
    }

    if (tray.plants.length === 0) {
      onPlacePlant(tray.id)
    } else {
      onSelectTray(tray, rackName)
    }
  }

  if (floorView.racks.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
        <p className="text-sm text-muted-foreground">
          No racks on this floor. Add racks in the room settings.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {floorView.racks.map((rack) => (
        <div key={rack.id} className="rounded-lg border bg-card p-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">{rack.name}</span>
            <span className="text-[10px] text-muted-foreground">
              {rack.trays.reduce((s, t) => s + t.plants.length, 0)}/{rack.total_capacity}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {rack.trays.map((tray) => {
              const hasSelectedPlant = tray.plants.some((p) => p.id === selectedPlantId)

              return (
                <TrayCell
                  key={tray.id}
                  tray={tray}
                  isSelected={hasSelectedPlant || selectedTrayId === tray.id}
                  isMoveTarget={!!movingPlantId && tray.plants.length < tray.capacity}
                  onClick={() => handleTrayClick(tray, rack.name)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
