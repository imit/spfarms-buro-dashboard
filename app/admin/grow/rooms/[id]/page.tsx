"use client"

import { useEffect, useState, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  apiClient,
  type Room,
  type FloorView,
  type GridZone,
  type GridZonePlant,
  ROOM_TYPE_LABELS,
  type RoomType,
  GROWTH_PHASE_LABELS,
  type GrowthPhase,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RoomGrid } from "@/components/grow/room-grid"
import { FloorPicker } from "@/components/grow/floor-picker"
import { PlantPlacementDialog } from "@/components/grow/plant-placement-dialog"
import { PlantMoveDialog } from "@/components/grow/plant-move-dialog"
import { TagAssignDialog } from "@/components/grow/tag-assign-dialog"
import { PhaseBadge } from "@/components/grow/phase-badge"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  ArrowLeftIcon,
  Settings2Icon,
  MoveIcon,
  TagIcon,
  RefreshCwIcon,
  TrashIcon,
  StickyNoteIcon,
  PlusIcon,
  ExternalLinkIcon,
} from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [floorView, setFloorView] = useState<FloorView | null>(null)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Zone drawer state
  const [selectedZone, setSelectedZone] = useState<GridZone | null>(null)
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [movingPlantId, setMovingPlantId] = useState<number | null>(null)

  // Dialogs
  const [placementTarget, setPlacementTarget] = useState<{ row: number; col: number } | null>(null)
  const [moveDialogPlant, setMoveDialogPlant] = useState<{ id: number; uid: string; roomId: number; floor: number } | null>(null)
  const [tagDialogPlant, setTagDialogPlant] = useState<{ id: number; uid: string; currentTag: string | null } | null>(null)
  const [phaseDialogPlant, setPhaseDialogPlant] = useState<{ id: number; uid: string; currentPhase: GrowthPhase } | null>(null)
  const [noteDialogPlant, setNoteDialogPlant] = useState<{ id: number; uid: string } | null>(null)
  const [noteText, setNoteText] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  const loadFloorView = useCallback(async (roomId: number, floor: number) => {
    const fv = await apiClient.getFloorView(roomId, floor)
    setFloorView(fv)
    return fv
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const r = await apiClient.getRoom(Number(id))
        setRoom(r)
        await loadFloorView(r.id, 1)
      } catch {
        router.push("/admin/grow")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, id, router, loadFloorView])

  const handleFloorChange = async (floor: number) => {
    setCurrentFloor(floor)
    setSelectedZone(null)
    setSelectedPlantId(null)
    setMovingPlantId(null)
    if (room) await loadFloorView(room.id, floor)
  }

  const refresh = async () => {
    if (room) {
      const fv = await loadFloorView(room.id, currentFloor)
      const updatedRoom = await apiClient.getRoom(room.id)
      setRoom(updatedRoom)
      // Update selected zone from fresh data
      if (selectedZone) {
        const key = `${selectedZone.row}-${selectedZone.col}`
        const updatedZone = fv.grid[key]
        if (updatedZone) {
          setSelectedZone(updatedZone)
        } else {
          setSelectedZone(null)
        }
      }
    }
    setSelectedPlantId(null)
    setMovingPlantId(null)
  }

  const handlePlacePlant = (row: number, col: number) => {
    setPlacementTarget({ row, col })
  }

  const handleMovePlant = async (targetRow: number, targetCol: number) => {
    if (!movingPlantId || !room) return
    try {
      await apiClient.movePlant(movingPlantId, {
        room_id: room.id,
        floor: currentFloor,
        row: targetRow,
        col: targetCol,
      })
      toast.success("Plant moved")
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to move plant")
    }
  }

  const handleSelectZone = (zone: GridZone) => {
    setSelectedZone(zone)
    setSelectedPlantId(null)
    setMovingPlantId(null)
  }

  const handleChangePhase = async (newPhase: string) => {
    if (!phaseDialogPlant) return
    try {
      await apiClient.changePlantPhase(phaseDialogPlant.id, newPhase)
      toast.success("Phase changed")
      setPhaseDialogPlant(null)
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change phase")
    }
  }

  const handleDestroyPlant = async (plantId: number, reason: string) => {
    try {
      await apiClient.destroyPlant(plantId, reason)
      toast.success("Plant removed")
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove plant")
    }
  }

  const handleAddNote = async () => {
    if (!noteDialogPlant || !noteText.trim()) return
    try {
      await apiClient.addPlantNote(noteDialogPlant.id, noteText.trim())
      toast.success("Note added")
      setNoteDialogPlant(null)
      setNoteText("")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add note")
    }
  }

  const selectedZoneKey = selectedZone ? `${selectedZone.row}-${selectedZone.col}` : null
  const selectedZoneLabel = selectedZone
    ? `${String.fromCharCode(65 + selectedZone.col)}${selectedZone.row + 1}`
    : ""

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!room || !floorView) return null

  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/grow">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{room.name}</h1>
              {room.room_type && (
                <Badge variant="outline">{ROOM_TYPE_LABELS[room.room_type as RoomType]}</Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {room.rows}x{room.cols} grid &middot; {floorView.total_plants}/{room.total_capacity} plants
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/grow/rooms/${room.id}/edit`}>
            <Settings2Icon className="mr-2 h-3.5 w-3.5" /> Edit Room
          </Link>
        </Button>
      </div>

      {/* Floor Picker */}
      {room.floor_count > 1 && (
        <FloorPicker
          floors={room.floor_numbers}
          currentFloor={currentFloor}
          onFloorChange={handleFloorChange}
          plantCounts={room.plant_counts_by_floor}
        />
      )}

      {/* Grid */}
      <RoomGrid
        floorView={floorView}
        selectedPlantId={selectedPlantId}
        selectedZoneKey={selectedZoneKey}
        onSelectZone={handleSelectZone}
        onPlacePlant={handlePlacePlant}
        onMovePlant={handleMovePlant}
        movingPlantId={movingPlantId}
      />

      {movingPlantId && (
        <div className="bg-primary/10 text-primary flex items-center justify-between rounded-md p-3 text-sm">
          <span>Click a zone to move the plant there</span>
          <Button variant="ghost" size="sm" onClick={() => setMovingPlantId(null)}>
            Cancel Move
          </Button>
        </div>
      )}

      {/* Zone Detail Drawer */}
      <Sheet
        open={!!selectedZone}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedZone(null)
            setSelectedPlantId(null)
          }
        }}
      >
        <SheetContent side="right" className="overflow-y-auto">
          {selectedZone && (
            <>
              <SheetHeader>
                <SheetTitle>Zone {selectedZoneLabel}</SheetTitle>
                <SheetDescription>
                  {selectedZone.plants.length}/{selectedZone.capacity} plants
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 px-4 pb-4">
                {selectedZone.plants.map((plant) => (
                  <div
                    key={plant.id}
                    className={`rounded-lg border p-3 transition-colors ${
                      plant.id === selectedPlantId
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => setSelectedPlantId(selectedPlantId === plant.id ? null : plant.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{plant.strain_name}</p>
                          <p className="text-muted-foreground font-mono text-xs">{plant.plant_uid}</p>
                        </div>
                        <PhaseBadge phase={plant.growth_phase} />
                      </div>
                      {plant.custom_label && (
                        <p className="text-muted-foreground mt-1 text-xs italic">&ldquo;{plant.custom_label}&rdquo;</p>
                      )}
                      {plant.metrc_label && (
                        <div className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                          <TagIcon className="h-3 w-3" />
                          <span className="font-mono">{plant.metrc_label}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded actions */}
                    {plant.id === selectedPlantId && (
                      <div className="mt-3 flex flex-wrap gap-1.5 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => {
                            setSelectedZone(null)
                            setMovingPlantId(plant.id)
                          }}
                        >
                          <MoveIcon className="mr-1 h-3 w-3" /> Move (grid)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setMoveDialogPlant({
                              id: plant.id,
                              uid: plant.plant_uid,
                              roomId: room.id,
                              floor: currentFloor,
                            })
                          }
                        >
                          <MoveIcon className="mr-1 h-3 w-3" /> Move (room)
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setPhaseDialogPlant({
                              id: plant.id,
                              uid: plant.plant_uid,
                              currentPhase: plant.growth_phase,
                            })
                          }
                        >
                          <RefreshCwIcon className="mr-1 h-3 w-3" /> Phase
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setTagDialogPlant({
                              id: plant.id,
                              uid: plant.plant_uid,
                              currentTag: plant.metrc_label,
                            })
                          }
                        >
                          <TagIcon className="mr-1 h-3 w-3" /> Tag
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() =>
                            setNoteDialogPlant({ id: plant.id, uid: plant.plant_uid })
                          }
                        >
                          <StickyNoteIcon className="mr-1 h-3 w-3" /> Note
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive text-xs"
                          onClick={() => {
                            if (confirm("Remove this plant?")) {
                              handleDestroyPlant(plant.id, "Removed from grid")
                            }
                          }}
                        >
                          <TrashIcon className="mr-1 h-3 w-3" /> Remove
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          asChild
                        >
                          <Link href={`/admin/grow/plants/${plant.id}`}>
                            <ExternalLinkIcon className="mr-1 h-3 w-3" /> Details
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Plant button */}
                {selectedZone.plants.length < selectedZone.capacity && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const zone = selectedZone
                      setSelectedZone(null)
                      handlePlacePlant(zone.row, zone.col)
                    }}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" /> Add Plant
                  </Button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
      {placementTarget && (
        <PlantPlacementDialog
          open={!!placementTarget}
          onOpenChange={(open) => !open && setPlacementTarget(null)}
          roomId={room.id}
          floor={currentFloor}
          row={placementTarget.row}
          col={placementTarget.col}
          onPlaced={refresh}
        />
      )}

      {moveDialogPlant && (
        <PlantMoveDialog
          open={!!moveDialogPlant}
          onOpenChange={(open) => !open && setMoveDialogPlant(null)}
          plantId={moveDialogPlant.id}
          plantUid={moveDialogPlant.uid}
          currentRoomId={moveDialogPlant.roomId}
          currentFloor={moveDialogPlant.floor}
          onMoved={refresh}
        />
      )}

      {tagDialogPlant && (
        <TagAssignDialog
          open={!!tagDialogPlant}
          onOpenChange={(open) => !open && setTagDialogPlant(null)}
          plantId={tagDialogPlant.id}
          plantUid={tagDialogPlant.uid}
          currentTag={tagDialogPlant.currentTag}
          onAssigned={refresh}
        />
      )}

      {/* Phase Change Dialog */}
      {phaseDialogPlant && (
        <Dialog open={!!phaseDialogPlant} onOpenChange={(open) => !open && setPhaseDialogPlant(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Phase for {phaseDialogPlant.uid}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-muted-foreground text-sm">
                Current: <PhaseBadge phase={phaseDialogPlant.currentPhase} />
              </p>
              <Select onValueChange={handleChangePhase}>
                <SelectTrigger><SelectValue placeholder="Select new phase..." /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(GROWTH_PHASE_LABELS) as [GrowthPhase, string][])
                    .filter(([key]) => key !== phaseDialogPlant.currentPhase)
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Note Dialog */}
      {noteDialogPlant && (
        <Dialog open={!!noteDialogPlant} onOpenChange={(open) => { if (!open) { setNoteDialogPlant(null); setNoteText("") } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note to {noteDialogPlant.uid}</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label>Note</Label>
              <Input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Looking healthy, strong growth"
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setNoteDialogPlant(null); setNoteText("") }}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!noteText.trim()}>
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
