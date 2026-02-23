"use client"

import { useEffect, useState, use, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  apiClient,
  type Room,
  type FloorView,
  type TrayView,
  ROOM_TYPE_LABELS,
  type RoomType,
  GROWTH_PHASE_LABELS,
  type GrowthPhase,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FloorRackView } from "@/components/grow/floor-rack-view"
import { FloorPicker } from "@/components/grow/floor-picker"
import { PlantPlacementForm } from "@/components/grow/plant-placement-form"
import { PlantMoveDialog } from "@/components/grow/plant-move-dialog"
import { PlantDetailDialog } from "@/components/grow/plant-detail-dialog"
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
import { showError } from "@/lib/errors"

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [room, setRoom] = useState<Room | null>(null)
  const [floorView, setFloorView] = useState<FloorView | null>(null)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [isLoading, setIsLoading] = useState(true)

  // Tray drawer state
  const [selectedTray, setSelectedTray] = useState<TrayView | null>(null)
  const [selectedRackName, setSelectedRackName] = useState("")
  const [selectedPlantId, setSelectedPlantId] = useState<number | null>(null)
  const [movingPlantId, setMovingPlantId] = useState<number | null>(null)

  // Inline add-plant form in drawer
  const [showAddPlantForm, setShowAddPlantForm] = useState(false)

  // Dialogs
  const [moveDialogPlant, setMoveDialogPlant] = useState<{ id: number; uid: string; roomId: number; floor: number } | null>(null)
  const [tagDialogPlant, setTagDialogPlant] = useState<{ id: number; uid: string; currentTag: string | null } | null>(null)
  const [phaseDialogPlant, setPhaseDialogPlant] = useState<{ id: number; uid: string; currentPhase: GrowthPhase } | null>(null)
  const [noteDialogPlant, setNoteDialogPlant] = useState<{ id: number; uid: string } | null>(null)
  const [noteText, setNoteText] = useState("")
  const [detailDialogPlantId, setDetailDialogPlantId] = useState<number | null>(null)

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
    setSelectedTray(null)
    setSelectedPlantId(null)
    setMovingPlantId(null)
    if (room) await loadFloorView(room.id, floor)
  }

  const refresh = async () => {
    if (room) {
      const fv = await loadFloorView(room.id, currentFloor)
      const updatedRoom = await apiClient.getRoom(room.id)
      setRoom(updatedRoom)
      // Update selected tray from fresh data
      if (selectedTray) {
        for (const rack of fv.racks) {
          const updatedTray = rack.trays.find((t) => t.id === selectedTray.id)
          if (updatedTray) {
            setSelectedTray(updatedTray)
            break
          }
        }
      }
    }
    setSelectedPlantId(null)
    setMovingPlantId(null)
  }

  const handlePlacePlant = (trayId: number) => {
    // Find tray/rack from floorView, open drawer with add form
    if (!floorView) return
    for (const rack of floorView.racks) {
      const tray = rack.trays.find((t) => t.id === trayId)
      if (tray) {
        setSelectedTray(tray)
        setSelectedRackName(rack.name || `Rack ${rack.position + 1}`)
        setShowAddPlantForm(true)
        return
      }
    }
  }

  const handleMovePlantToTray = async (targetTrayId: number) => {
    if (!movingPlantId) return
    try {
      await apiClient.movePlant(movingPlantId, { tray_id: targetTrayId })
      toast.success("Plant moved")
      await refresh()
    } catch (err) {
      showError("move the plant", err)
    }
  }

  const handleSelectTray = (tray: TrayView, rackName: string) => {
    setSelectedTray(tray)
    setSelectedRackName(rackName)
    setSelectedPlantId(null)
    setMovingPlantId(null)
    setShowAddPlantForm(false)
  }

  const handleChangePhase = async (newPhase: string) => {
    if (!phaseDialogPlant) return
    try {
      await apiClient.changePlantPhase(phaseDialogPlant.id, newPhase)
      toast.success("Phase changed")
      setPhaseDialogPlant(null)
      await refresh()
    } catch (err) {
      showError("change the phase", err)
    }
  }

  const handleDestroyPlant = async (plantId: number, reason: string) => {
    try {
      await apiClient.destroyPlant(plantId, reason)
      toast.success("Plant removed")
      await refresh()
    } catch (err) {
      showError("remove the plant", err)
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
      showError("add the note", err)
    }
  }

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
            <div className="flex items-center gap-3 text-sm">
              <span className="text-muted-foreground">
                {room.rack_count} rack{room.rack_count !== 1 ? "s" : ""} &middot; {room.tray_count} tray{room.tray_count !== 1 ? "s" : ""} &middot; {floorView.total_plants}/{room.total_capacity} plants
              </span>
              <span className="text-muted-foreground/40">|</span>
              <div className="flex items-center gap-1.5">
                {(Object.entries(GROWTH_PHASE_LABELS) as [GrowthPhase, string][]).map(([phase, label]) => (
                  <span
                    key={phase}
                    className={`rounded px-1.5 py-0.5 text-[10px] font-medium leading-none ${
                      phase === "immature"
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        : phase === "vegetative"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                          : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
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

      {/* Rack/Tray View */}
      <FloorRackView
        floorView={floorView}
        selectedPlantId={selectedPlantId}
        selectedTrayId={selectedTray?.id ?? null}
        onSelectTray={handleSelectTray}
        onPlacePlant={handlePlacePlant}
        onMovePlant={handleMovePlantToTray}
        movingPlantId={movingPlantId}
      />

      {movingPlantId && (
        <div className="bg-primary/10 text-primary flex items-center justify-between rounded-md p-3 text-sm">
          <span>Click a tray to move the plant there</span>
          <Button variant="ghost" size="sm" onClick={() => setMovingPlantId(null)}>
            Cancel Move
          </Button>
        </div>
      )}

      {/* Tray Detail Drawer */}
      <Sheet
        open={!!selectedTray}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTray(null)
            setSelectedPlantId(null)
            setShowAddPlantForm(false)
          }
        }}
      >
        <SheetContent side="right" className="overflow-y-auto">
          {selectedTray && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRackName} &middot; {selectedTray.name || `Tray ${selectedTray.position + 1}`}</SheetTitle>
                <SheetDescription>
                  {selectedTray.plants.length}/{selectedTray.capacity} plants
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 px-4 pb-4">
                {selectedTray.plants.map((plant) => (
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
                            setSelectedTray(null)
                            setMovingPlantId(plant.id)
                          }}
                        >
                          <MoveIcon className="mr-1 h-3 w-3" /> Move (visual)
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
                              handleDestroyPlant(plant.id, "Removed from tray")
                            }
                          }}
                        >
                          <TrashIcon className="mr-1 h-3 w-3" /> Remove
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs"
                          onClick={() => setDetailDialogPlantId(plant.id)}
                        >
                          <ExternalLinkIcon className="mr-1 h-3 w-3" /> Details
                        </Button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add Plant */}
                {selectedTray.plants.length < selectedTray.capacity && (
                  showAddPlantForm ? (
                    <PlantPlacementForm
                      trayId={selectedTray.id}
                      onPlaced={() => {
                        toast.success("Plant placed")
                        refresh()
                      }}
                      onCancel={() => setShowAddPlantForm(false)}
                    />
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAddPlantForm(true)}
                    >
                      <PlusIcon className="mr-2 h-4 w-4" /> Add Plant
                    </Button>
                  )
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Dialogs */}
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

      {/* Plant Detail Dialog */}
      {detailDialogPlantId && (
        <PlantDetailDialog
          open={!!detailDialogPlantId}
          onOpenChange={(open) => !open && setDetailDialogPlantId(null)}
          plantId={detailDialogPlantId}
        />
      )}
    </div>
  )
}
