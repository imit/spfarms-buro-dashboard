"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { apiClient, type Room, type Rack, ROOM_TYPE_LABELS, type RoomType } from "@/lib/api"
import { useRouter } from "next/navigation"
import { PlusIcon, Trash2Icon } from "lucide-react"

interface TrayConfig {
  id?: number
  position: number
  capacity: number
  name: string
  _destroy?: boolean
}

interface RackConfig {
  id?: number
  floor: number
  position: number
  name: string
  trays: TrayConfig[]
  _destroy?: boolean
}

interface RoomFormProps {
  room?: Room
}

export function RoomForm({ room }: RoomFormProps) {
  const router = useRouter()
  const [name, setName] = useState(room?.name || "")
  const [roomType, setRoomType] = useState(room?.room_type || "")
  const [floorCount, setFloorCount] = useState(room?.floor_count || 1)
  const [racks, setRacks] = useState<RackConfig[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingRacks, setIsLoadingRacks] = useState(!!room)
  const [error, setError] = useState("")

  // Quick-fill state
  const [qfFloor, setQfFloor] = useState(1)
  const [qfRackCount, setQfRackCount] = useState(3)
  const [qfTrayCount, setQfTrayCount] = useState(4)
  const [qfCapacity, setQfCapacity] = useState(4)

  // Load existing racks when editing
  useEffect(() => {
    if (!room) return
    async function loadRacks() {
      try {
        const existingRacks = await apiClient.getRacks(room!.id)
        setRacks(
          existingRacks.map((r: Rack) => ({
            id: r.id,
            floor: r.floor,
            position: r.position,
            name: r.name || "",
            trays: r.trays.map((t) => ({
              id: t.id,
              position: t.position,
              capacity: t.capacity,
              name: t.name || "",
            })),
          }))
        )
      } catch {
        // If fetching fails, start with empty
      } finally {
        setIsLoadingRacks(false)
      }
    }
    loadRacks()
  }, [room])

  function addRack(floor: number) {
    const floorRacks = racks.filter((r) => r.floor === floor && !r._destroy)
    setRacks([...racks, {
      floor,
      position: floorRacks.length,
      name: "",
      trays: [{ position: 0, capacity: 4, name: "" }],
    }])
  }

  function removeRack(floor: number, rackIndex: number) {
    const floorRacks = racks.filter((r) => r.floor === floor && !r._destroy)
    const rack = floorRacks[rackIndex]
    if (rack.id) {
      // Mark existing rack for destruction
      setRacks(racks.map((r) => r === rack ? { ...r, _destroy: true } : r))
    } else {
      // Remove new rack entirely
      setRacks(racks.filter((r) => r !== rack))
    }
  }

  function addTray(floor: number, rackIndex: number) {
    const floorRacks = racks.filter((r) => r.floor === floor && !r._destroy)
    const rack = floorRacks[rackIndex]
    const activeTrays = rack.trays.filter((t) => !t._destroy)
    setRacks(racks.map((r) =>
      r === rack
        ? { ...r, trays: [...r.trays, { position: activeTrays.length, capacity: 4, name: "" }] }
        : r
    ))
  }

  function removeTray(floor: number, rackIndex: number, trayIndex: number) {
    const floorRacks = racks.filter((r) => r.floor === floor && !r._destroy)
    const rack = floorRacks[rackIndex]
    const activeTrays = rack.trays.filter((t) => !t._destroy)
    const tray = activeTrays[trayIndex]
    if (tray.id) {
      // Mark existing tray for destruction
      setRacks(racks.map((r) =>
        r === rack
          ? { ...r, trays: r.trays.map((t) => t === tray ? { ...t, _destroy: true } : t) }
          : r
      ))
    } else {
      // Remove new tray entirely
      setRacks(racks.map((r) =>
        r === rack
          ? { ...r, trays: r.trays.filter((t) => t !== tray) }
          : r
      ))
    }
  }

  function updateTrayCapacity(floor: number, rackIndex: number, trayIndex: number, capacity: number) {
    const floorRacks = racks.filter((r) => r.floor === floor && !r._destroy)
    const rack = floorRacks[rackIndex]
    const activeTrays = rack.trays.filter((t) => !t._destroy)
    const tray = activeTrays[trayIndex]
    setRacks(racks.map((r) =>
      r === rack
        ? { ...r, trays: r.trays.map((t) => t === tray ? { ...t, capacity } : t) }
        : r
    ))
  }

  function quickFill() {
    const newRacks: RackConfig[] = []
    const existingFloorRacks = racks.filter((r) => r.floor === qfFloor && !r._destroy)
    const startPos = existingFloorRacks.length

    for (let i = 0; i < qfRackCount; i++) {
      const trays: TrayConfig[] = []
      for (let j = 0; j < qfTrayCount; j++) {
        trays.push({ position: j, capacity: qfCapacity, name: "" })
      }
      newRacks.push({ floor: qfFloor, position: startPos + i, name: "", trays })
    }
    setRacks([...racks, ...newRacks])
  }

  const activeRacks = racks.filter((r) => !r._destroy)
  const totalCapacity = activeRacks.reduce((sum, r) => sum + r.trays.filter((t) => !t._destroy).reduce((s, t) => s + t.capacity, 0), 0)
  const totalTrays = activeRacks.reduce((sum, r) => sum + r.trays.filter((t) => !t._destroy).length, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const data = {
        name,
        room_type: roomType || undefined,
        floor_count: floorCount,
        racks_attributes: racks.map((r) => ({
          ...(r.id ? { id: r.id } : {}),
          ...(r._destroy ? { _destroy: true } : {}),
          floor: r.floor,
          position: r.position,
          name: r.name || undefined,
          trays_attributes: r.trays.map((t) => ({
            ...(t.id ? { id: t.id } : {}),
            ...(t._destroy ? { _destroy: true } : {}),
            position: t.position,
            capacity: t.capacity,
            name: t.name || undefined,
          })),
        })),
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

  if (isLoadingRacks) {
    return <p className="text-muted-foreground py-4 text-sm">Loading rack configuration...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Room basics */}
      <div className="grid gap-4 sm:grid-cols-3">
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
        <div className="space-y-2">
          <Label>Floors</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={floorCount}
            onChange={(e) => setFloorCount(Number(e.target.value) || 1)}
            required
          />
        </div>
      </div>

      <Separator />

      {/* Quick fill */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
        <p className="text-sm font-medium">Quick Fill</p>
        <p className="text-xs text-muted-foreground">Bulk-add racks with a default capacity. You can adjust each tray individually below.</p>
        <div className="grid gap-3 sm:grid-cols-5 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Floor</Label>
            <Select value={String(qfFloor)} onValueChange={(v) => setQfFloor(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: floorCount }, (_, i) => (
                  <SelectItem key={i + 1} value={String(i + 1)}>Floor {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Racks</Label>
            <Input type="number" min={1} max={50} value={qfRackCount} onChange={(e) => setQfRackCount(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Trays/Rack</Label>
            <Input type="number" min={1} max={50} value={qfTrayCount} onChange={(e) => setQfTrayCount(Number(e.target.value) || 1)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Default Plants/Tray</Label>
            <Input type="number" min={1} max={100} value={qfCapacity} onChange={(e) => setQfCapacity(Number(e.target.value) || 1)} />
          </div>
          <Button type="button" variant="outline" size="sm" onClick={quickFill}>
            <PlusIcon className="mr-1 size-3" />
            Add
          </Button>
        </div>
      </div>

      {/* Per-floor rack/tray configuration */}
      {Array.from({ length: floorCount }, (_, floorIdx) => {
        const floor = floorIdx + 1
        const floorRacks = racks.filter((r) => r.floor === floor && !r._destroy)

        return (
          <div key={floor} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Floor {floor}</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => addRack(floor)}>
                <PlusIcon className="mr-1 size-3" />
                Add Rack
              </Button>
            </div>

            {floorRacks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">No racks on this floor. Add racks above or use Quick Fill.</p>
            ) : (
              <div className="space-y-2">
                {floorRacks.map((rack, rackIdx) => {
                  const activeTrays = rack.trays.filter((t) => !t._destroy)
                  return (
                    <div key={rack.id ?? `new-${rackIdx}`} className="rounded-lg border bg-card p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">Rack {rackIdx + 1}</span>
                          <Input
                            value={rack.name}
                            onChange={(e) => {
                              setRacks(racks.map((r) => r === rack ? { ...r, name: e.target.value } : r))
                            }}
                            placeholder="Name (optional)"
                            className="h-7 w-40 text-xs"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => addTray(floor, rackIdx)}>
                            <PlusIcon className="mr-1 size-3" />
                            Tray
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => removeRack(floor, rackIdx)}>
                            <Trash2Icon className="size-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {activeTrays.map((tray, trayIdx) => (
                          <div key={tray.id ?? `new-${trayIdx}`} className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1">
                            <span className="text-[10px] text-muted-foreground">T{trayIdx + 1}</span>
                            <Input
                              type="number"
                              min={1}
                              max={100}
                              value={tray.capacity}
                              onChange={(e) => updateTrayCapacity(floor, rackIdx, trayIdx, Number(e.target.value) || 1)}
                              className="h-6 w-12 text-xs text-center p-0"
                            />
                            {activeTrays.length > 1 && (
                              <button type="button" onClick={() => removeTray(floor, rackIdx, trayIdx)} className="text-muted-foreground hover:text-destructive">
                                <Trash2Icon className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {floorIdx < floorCount - 1 && <Separator />}
          </div>
        )
      })}

      {/* Summary */}
      <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
        <span className="text-muted-foreground">Total:</span>{" "}
        {activeRacks.length} rack{activeRacks.length !== 1 ? "s" : ""},{" "}
        {totalTrays} tray{totalTrays !== 1 ? "s" : ""},{" "}
        {totalCapacity} plant capacity
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
