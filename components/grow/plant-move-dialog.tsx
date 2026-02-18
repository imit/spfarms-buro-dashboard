"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { apiClient, type Room } from "@/lib/api"

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
  const [targetRow, setTargetRow] = useState("")
  const [targetCol, setTargetCol] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  // Reset floor when room changes
  useEffect(() => {
    if (selectedRoom && Number(targetFloor) > selectedRoom.floor_count) {
      setTargetFloor("1")
    }
  }, [targetRoomId, selectedRoom, targetFloor])

  const handleSubmit = async () => {
    if (!targetRow || !targetCol) return
    setIsSubmitting(true)
    setError("")

    try {
      await apiClient.movePlant(plantId, {
        room_id: Number(targetRoomId),
        floor: Number(targetFloor),
        row: Number(targetRow),
        col: Number(targetCol),
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
            <Label>Target Room</Label>
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

          {selectedRoom && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Row</Label>
                <Select value={targetRow} onValueChange={setTargetRow}>
                  <SelectTrigger><SelectValue placeholder="Row" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedRoom.rows }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{i + 1}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Column</Label>
                <Select value={targetCol} onValueChange={setTargetCol}>
                  <SelectTrigger><SelectValue placeholder="Col" /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: selectedRoom.cols }, (_, i) => (
                      <SelectItem key={i} value={String(i)}>{String.fromCharCode(65 + i)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!targetRow || !targetCol || isSubmitting}>
            {isSubmitting ? "Moving..." : "Move Plant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
