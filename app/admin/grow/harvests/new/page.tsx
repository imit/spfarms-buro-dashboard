"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Plant, type Facility, GROWTH_PHASE_LABELS } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import { ArrowLeftIcon, ScissorsIcon, TagIcon } from "lucide-react"
import Link from "next/link"

export default function NewHarvestPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [plants, setPlants] = useState<Plant[]>([])
  const [facility, setFacility] = useState<Facility | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlantIds, setSelectedPlantIds] = useState<Set<number>>(new Set())

  // Form state
  const [harvestName, setHarvestName] = useState("")
  const [harvestType, setHarvestType] = useState("whole_plant")
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0])
  const [wetWeight, setWetWeight] = useState("")
  const [dryingRoomId, setDryingRoomId] = useState("")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Filters
  const [filterRoom, setFilterRoom] = useState("all")
  const [filterStrain, setFilterStrain] = useState("all")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const [p, f] = await Promise.all([
          apiClient.getPlants({ growth_phase: "flowering" }),
          apiClient.getFacility(),
        ])
        setPlants(p)
        setFacility(f)
      } catch {
        setError("Failed to load plants")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated])

  const rooms = useMemo(() => {
    const map = new Map<number, string>()
    plants.forEach((p) => { if (p.room) map.set(p.room.id, p.room.name) })
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [plants])

  const strains = useMemo(() => {
    const map = new Map<number, string>()
    plants.forEach((p) => map.set(p.strain.id, p.strain.name))
    return Array.from(map, ([id, name]) => ({ id, name }))
  }, [plants])

  const filteredPlants = useMemo(() => {
    return plants.filter((p) => {
      if (filterRoom !== "all" && p.room?.id !== Number(filterRoom)) return false
      if (filterStrain !== "all" && p.strain.id !== Number(filterStrain)) return false
      return true
    })
  }, [plants, filterRoom, filterStrain])

  const selectedPlants = useMemo(() => {
    return plants.filter((p) => selectedPlantIds.has(p.id))
  }, [plants, selectedPlantIds])

  const togglePlant = (id: number) => {
    setSelectedPlantIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedPlantIds.size === filteredPlants.length) {
      setSelectedPlantIds(new Set())
    } else {
      setSelectedPlantIds(new Set(filteredPlants.map((p) => p.id)))
    }
  }

  const dryingRooms = facility?.rooms.filter((r) => r.room_type === "dry" || r.room_type === "cure") || []

  const handleSubmit = async () => {
    if (selectedPlantIds.size === 0) return
    setIsSubmitting(true)
    setError("")

    try {
      const harvest = await apiClient.createHarvest({
        harvest: {
          name: harvestName || undefined,
          harvest_type: harvestType,
          harvest_date: harvestDate,
          wet_weight_grams: wetWeight ? Number(wetWeight) : undefined,
          drying_room_id: dryingRoomId ? Number(dryingRoomId) : undefined,
          notes: notes || undefined,
        },
        plant_ids: Array.from(selectedPlantIds),
      })
      router.push(`/admin/grow/harvests/${harvest.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create harvest")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow/harvests"><ArrowLeftIcon className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">New Harvest</h1>
          <p className="text-muted-foreground text-sm">Select flowering plants and configure harvest details</p>
        </div>
      </div>

      {/* Step 1: Select Plants */}
      <div className="space-y-3">
        <h2 className="text-lg font-medium">1. Select Plants</h2>
        <p className="text-muted-foreground text-sm">Only flowering plants are shown. Select the plants to harvest.</p>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStrain} onValueChange={setFilterStrain}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
              <SelectValue placeholder="All Strains" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Strains</SelectItem>
              {strains.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-muted-foreground text-xs">
            {selectedPlantIds.size} of {filteredPlants.length} selected
          </span>
        </div>

        {filteredPlants.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center">
            <p className="text-muted-foreground text-sm">No flowering plants available for harvest.</p>
          </div>
        ) : (
          <div className="rounded-lg border">
            {/* Header */}
            <div className="flex items-center gap-3 px-3 py-2 border-b bg-muted/50">
              <Checkbox
                checked={selectedPlantIds.size === filteredPlants.length && filteredPlants.length > 0}
                onCheckedChange={toggleAll}
              />
              <span className="text-xs font-medium text-muted-foreground flex-1">Plant</span>
              <span className="text-xs font-medium text-muted-foreground w-24">Room</span>
              <span className="text-xs font-medium text-muted-foreground w-24">Tray</span>
              <span className="text-xs font-medium text-muted-foreground w-28">METRC Tag</span>
            </div>
            <div className="divide-y max-h-[400px] overflow-y-auto">
              {filteredPlants.map((plant) => (
                <label
                  key={plant.id}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedPlantIds.has(plant.id)}
                    onCheckedChange={() => togglePlant(plant.id)}
                  />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StrainAvatar name={plant.strain.name} size={22} />
                    <div className="min-w-0">
                      <span className="text-sm font-medium truncate block">{plant.strain.name}</span>
                      <span className="text-muted-foreground text-[10px]">{plant.plant_uid}</span>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground w-24 truncate">{plant.room?.name || "—"}</span>
                  <span className="text-xs text-muted-foreground w-24 truncate">{plant.rack?.name || "—"} / {plant.tray?.name || "—"}</span>
                  <span className="text-xs text-muted-foreground w-28 font-mono truncate">
                    {plant.metrc_label ? (
                      <><TagIcon className="inline h-3 w-3 mr-0.5" />{plant.metrc_label.slice(-8)}</>
                    ) : (
                      <span className="text-muted-foreground/50">—</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Harvest Details */}
      {selectedPlantIds.size > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-medium">2. Harvest Details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-sm">Harvest Name <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={harvestName}
                onChange={(e) => setHarvestName(e.target.value)}
                placeholder="Auto: Harvest 1, Harvest 2..."
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Harvest Date</Label>
              <Input
                type="date"
                value={harvestDate}
                onChange={(e) => setHarvestDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Harvest Type</Label>
              <Select value={harvestType} onValueChange={setHarvestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whole_plant">Whole Plant</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Total Wet Weight (g) <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                type="number"
                value={wetWeight}
                onChange={(e) => setWetWeight(e.target.value)}
                placeholder="e.g. 2400"
              />
            </div>
            {dryingRooms.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm">Drying Room <span className="text-muted-foreground">(optional)</span></Label>
                <Select value={dryingRoomId} onValueChange={setDryingRoomId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a drying room..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dryingRooms.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-sm">Notes <span className="text-muted-foreground">(optional)</span></Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any notes about this harvest..."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
            <p className="text-sm font-medium">Summary</p>
            <p className="text-muted-foreground text-sm">
              Harvesting <span className="text-foreground font-medium">{selectedPlantIds.size}</span> plant{selectedPlantIds.size !== 1 ? "s" : ""}
              {" "}from{" "}
              <span className="text-foreground font-medium">{[...new Set(selectedPlants.map((p) => p.strain.name))].join(", ")}</span>
            </p>
            <p className="text-muted-foreground text-xs">
              These plants will be marked as harvested and their tray slots will be freed.
            </p>
          </div>

          {error && <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</p>}

          <div className="flex gap-3">
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              <ScissorsIcon className="mr-2 h-4 w-4" />
              {isSubmitting ? "Creating Harvest..." : "Create Harvest"}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/grow/harvests">Cancel</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
