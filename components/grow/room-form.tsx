"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, type Room, ROOM_TYPE_LABELS, type RoomType } from "@/lib/api"
import { useRouter } from "next/navigation"

interface RoomFormProps {
  room?: Room
}

export function RoomForm({ room }: RoomFormProps) {
  const router = useRouter()
  const [name, setName] = useState(room?.name || "")
  const [roomType, setRoomType] = useState(room?.room_type || "")
  const [floorCount, setFloorCount] = useState(String(room?.floor_count || 1))
  const [rows, setRows] = useState(String(room?.rows || 4))
  const [cols, setCols] = useState(String(room?.cols || 4))
  const [defaultCapacity, setDefaultCapacity] = useState(String(room?.default_zone_capacity || 4))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const data = {
        name,
        room_type: roomType || undefined,
        floor_count: Number(floorCount),
        rows: Number(rows),
        cols: Number(cols),
        default_zone_capacity: Number(defaultCapacity),
      }

      if (room) {
        await apiClient.updateRoom(room.id, data)
        router.push(`/admin/grow/rooms/${room.id}`)
      } else {
        const created = await apiClient.createRoom(data)
        router.push(`/admin/grow/rooms/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save room")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Room Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Veg Room A"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Room Type</Label>
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROOM_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label>Floors</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={floorCount}
            onChange={(e) => setFloorCount(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Rows</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={rows}
            onChange={(e) => setRows(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Columns</Label>
          <Input
            type="number"
            min={1}
            max={50}
            value={cols}
            onChange={(e) => setCols(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Plants per Zone</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={defaultCapacity}
            onChange={(e) => setDefaultCapacity(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Grid preview */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Preview ({rows} x {cols} = {Number(rows) * Number(cols)} zones, {Number(floorCount)} floor{Number(floorCount) !== 1 ? "s" : ""}, {Number(rows) * Number(cols) * Number(defaultCapacity)} total capacity per floor)</Label>
        <div
          className="grid gap-1 rounded-md border p-3"
          style={{ gridTemplateColumns: `repeat(${Math.min(Number(cols), 20)}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: Math.min(Number(rows) * Number(cols), 400) }, (_, i) => (
            <div
              key={i}
              className="bg-muted/50 aspect-square rounded border border-dashed"
            />
          ))}
        </div>
      </div>

      {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={!name || isSubmitting}>
          {isSubmitting ? "Saving..." : room ? "Update Room" : "Create Room"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/grow")}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
