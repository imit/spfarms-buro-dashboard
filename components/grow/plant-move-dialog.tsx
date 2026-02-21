"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { apiClient, type Room, type FloorView, type RackView, type TrayView } from "@/lib/api"

interface PlantMoveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: number
  plantUid: string
  currentRoomId: number
  currentFloor: number
  onMoved: () => void
}

export function PlantMoveDialog({
  open,
  onOpenChange,
  plantId,
  plantUid,
  currentRoomId,
  currentFloor,
  onMoved,
}: PlantMoveDialogProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [targetRoomId, setTargetRoomId] = useState(String(currentRoomId))
  const [targetFloor, setTargetFloor] = useState(String(currentFloor))
  const [floorView, setFloorView] = useState<FloorView | null>(null)
  const [targetRackId, setTargetRackId] = useState("")
  const [targetTrayId, setTargetTrayId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingFloor, setIsLoadingFloor] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    async function load() {
      const r = await apiClient.getRooms()
      setRooms(r)
    }
    load()
  }, [open])

  const selectedRoom = rooms.find((r) => String(r.id) === targetRoomId)

  // Load floor view when room or floor changes
  useEffect(() => {
    if (!selectedRoom) return
    setIsLoadingFloor(true)
    setTargetRackId("")
    setTargetTrayId("")
    apiClient
      .getFloorView(selectedRoom.id, Number(targetFloor))
      .then((fv) => setFloorView(fv))
      .catch(() => setFloorView(null))
      .finally(() => setIsLoadingFloor(false))
  }, [targetRoomId, targetFloor, selectedRoom])

  // Reset floor when room changes
  useEffect(() => {
    if (selectedRoom && Number(targetFloor) > selectedRoom.floor_count) {
      setTargetFloor("1")
    }
  }, [targetRoomId, selectedRoom, targetFloor])

  // Reset tray when rack changes
  useEffect(() => {
    setTargetTrayId("")
  }, [targetRackId])

  const selectedRack: RackView | undefined = floorView?.racks.find(
    (r) => String(r.id) === targetRackId
  )

  const availableTrays: TrayView[] = selectedRack
    ? selectedRack.trays.filter((t) => t.plants.length < t.capacity)
    : []

  const handleSubmit = async () => {
    if (!targetTrayId) return
    setIsSubmitting(true)
    setError("")

    try {
      await apiClient.movePlant(plantId, {
        tray_id: Number(targetTrayId),
      })
      onMoved()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move plant")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move {plantUid}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Room</Label>
            <Select value={targetRoomId} onValueChange={setTargetRoomId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {rooms.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRoom && selectedRoom.floor_count > 1 && (
            <div className="space-y-2">
              <Label>Floor</Label>
              <Select value={targetFloor} onValueChange={setTargetFloor}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: selectedRoom.floor_count }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>Floor {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {floorView && !isLoadingFloor && (
            <div className="space-y-2">
              <Label>Rack</Label>
              <Select value={targetRackId} onValueChange={setTargetRackId}>
                <SelectTrigger><SelectValue placeholder="Select rack..." /></SelectTrigger>
                <SelectContent>
                  {floorView.racks.map((rack) => {
                    const available = rack.trays.filter((t) => t.plants.length < t.capacity).length
                    return (
                      <SelectItem key={rack.id} value={String(rack.id)} disabled={available === 0}>
                        {rack.name || `Rack ${rack.position + 1}`}
                        {available > 0
                          ? ` (${available} tray${available !== 1 ? "s" : ""} available)`
                          : " (full)"}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedRack && (
            <div className="space-y-2">
              <Label>Tray</Label>
              {availableTrays.length === 0 ? (
                <p className="text-muted-foreground text-sm">No available trays in this rack.</p>
              ) : (
                <Select value={targetTrayId} onValueChange={setTargetTrayId}>
                  <SelectTrigger><SelectValue placeholder="Select tray..." /></SelectTrigger>
                  <SelectContent>
                    {availableTrays.map((tray) => (
                      <SelectItem key={tray.id} value={String(tray.id)}>
                        {tray.name || `Tray ${tray.position + 1}`} ({tray.plants.length}/{tray.capacity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {isLoadingFloor && (
            <p className="text-muted-foreground text-sm">Loading racks...</p>
          )}

          {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!targetTrayId || isSubmitting}>
            {isSubmitting ? "Moving..." : "Move Plant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
