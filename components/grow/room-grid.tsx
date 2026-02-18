"use client"

import { type FloorView, type GridZone } from "@/lib/api"
import { GridZoneCell } from "./grid-zone-cell"

interface RoomGridProps {
  floorView: FloorView
  selectedPlantId: number | null
  selectedZoneKey: string | null
  onSelectZone: (zone: GridZone) => void
  onPlacePlant: (row: number, col: number) => void
  onMovePlant: (targetRow: number, targetCol: number) => void
  movingPlantId: number | null
}

export function RoomGrid({
  floorView,
  selectedPlantId,
  selectedZoneKey,
  onSelectZone,
  onPlacePlant,
  onMovePlant,
  movingPlantId,
}: RoomGridProps) {
  const handleCellClick = (zone: GridZone) => {
    if (movingPlantId) {
      onMovePlant(zone.row, zone.col)
      return
    }

    if (zone.plants.length === 0) {
      onPlacePlant(zone.row, zone.col)
    } else {
      onSelectZone(zone)
    }
  }

  return (
    <div className="space-y-2">
      {/* Column labels */}
      <div
        className="grid gap-1.5 pl-8"
        style={{ gridTemplateColumns: `repeat(${floorView.cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: floorView.cols }, (_, i) => (
          <div key={i} className="text-muted-foreground text-center text-[10px] font-medium uppercase">
            {String.fromCharCode(65 + i)}
          </div>
        ))}
      </div>

      {/* Grid with row labels */}
      {Array.from({ length: floorView.rows }, (_, rowIdx) => (
        <div key={rowIdx} className="flex items-stretch gap-1.5">
          {/* Row label */}
          <div className="text-muted-foreground flex w-6 items-center justify-end text-[10px] font-medium">
            {rowIdx + 1}
          </div>
          {/* Row cells */}
          <div
            className="grid flex-1 gap-1.5"
            style={{ gridTemplateColumns: `repeat(${floorView.cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: floorView.cols }, (_, colIdx) => {
              const key = `${rowIdx}-${colIdx}`
              const zone = floorView.grid[key]
              if (!zone) return <div key={key} />

              const hasSelectedPlant = zone.plants.some((p) => p.id === selectedPlantId)

              return (
                <GridZoneCell
                  key={key}
                  zone={zone}
                  isSelected={hasSelectedPlant || selectedZoneKey === key}
                  isMoveTarget={!!movingPlantId && zone.plants.length < zone.capacity}
                  onClick={() => handleCellClick(zone)}
                />
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
