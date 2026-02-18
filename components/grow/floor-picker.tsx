import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FloorPickerProps {
  floors: number[]
  currentFloor: number
  onFloorChange: (floor: number) => void
  plantCounts?: Record<number, number>
}

export function FloorPicker({ floors, currentFloor, onFloorChange, plantCounts }: FloorPickerProps) {
  return (
    <Tabs
      value={`floor-${currentFloor}`}
      onValueChange={(val) => onFloorChange(Number(val.replace("floor-", "")))}
    >
      <TabsList>
        {floors.map((f) => (
          <TabsTrigger key={f} value={`floor-${f}`}>
            Floor {f}
            {plantCounts && plantCounts[f] !== undefined && (
              <span className="text-muted-foreground ml-1.5 text-xs">
                ({plantCounts[f]})
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
