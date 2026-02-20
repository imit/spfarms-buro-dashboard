"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Facility, type PlantBatch, ROOM_TYPE_LABELS, BATCH_TYPE_LABELS, type RoomType } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FacilitySetupForm } from "@/components/grow/facility-setup-form"
import { BatchCreateDialog } from "@/components/grow/batch-create-dialog"
import { PlusIcon, LayoutGridIcon, TagIcon, SproutIcon, LayersIcon } from "lucide-react"
import Link from "next/link"

export default function GrowPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showBatchCreate, setShowBatchCreate] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const [f, b] = await Promise.all([
          apiClient.getFacility(),
          apiClient.getPlantBatches().catch(() => []),
        ])
        setFacility(f)
        setBatches(b)
        if (!f) setShowSetup(true)
      } catch {
        // Facility doesn't exist yet
        setShowSetup(true)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated])

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Grow</h1>
          <p className="text-muted-foreground text-sm">Manage your facility, rooms, plants, and METRC tags</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/grow/tags">
              <TagIcon className="mr-2 h-4 w-4" /> METRC Tags
            </Link>
          </Button>
          {facility && (
            <Button asChild>
              <Link href="/admin/grow/rooms/new">
                <PlusIcon className="mr-2 h-4 w-4" /> Add Room
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Facility Setup */}
      {(showSetup || !facility) && (
        <Card>
          <CardHeader>
            <CardTitle>{facility ? "Facility Settings" : "Set Up Your Facility"}</CardTitle>
          </CardHeader>
          <CardContent>
            <FacilitySetupForm
              facility={facility}
              onSaved={(f) => {
                setFacility(f)
                setShowSetup(false)
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Facility Info Bar */}
      {facility && !showSetup && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="font-medium">{facility.name}</p>
                <p className="text-muted-foreground text-xs">
                  {facility.rooms.length} room{facility.rooms.length !== 1 ? "s" : ""}
                  {facility.license_number && <> &middot; {facility.license_number}</>}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)}>
              Edit
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plant Batches */}
      {facility && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Plant Batches</h2>
            <Button variant="outline" size="sm" onClick={() => setShowBatchCreate(true)}>
              <PlusIcon className="mr-1 h-3.5 w-3.5" /> New Batch
            </Button>
          </div>
          {batches.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <LayersIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No batches yet. Create a batch to start grouping plants.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {batches.map((batch) => (
                <Card key={batch.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{batch.name}</p>
                        <p className="text-muted-foreground text-xs">{batch.strain?.name}</p>
                      </div>
                      <Badge variant="outline">{BATCH_TYPE_LABELS[batch.batch_type]}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <span>{batch.active_plant_count}/{batch.initial_count} active</span>
                      <span className="text-muted-foreground font-mono">{batch.batch_uid}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rooms Grid */}
      {facility && (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">Rooms</h2>
          {facility.rooms.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <LayoutGridIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
                <p className="text-muted-foreground text-sm">No rooms yet. Add your first grow room to get started.</p>
                <Button className="mt-4" asChild>
                  <Link href="/admin/grow/rooms/new">
                    <PlusIcon className="mr-2 h-4 w-4" /> Add Room
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {facility.rooms.map((room) => {
                const occupancyPct = room.total_capacity > 0
                  ? Math.round((room.active_plant_count / room.total_capacity) * 100)
                  : 0

                return (
                  <Link key={room.id} href={`/admin/grow/rooms/${room.id}`}>
                    <Card className="hover:bg-accent/50 transition-colors">
                      <CardContent className="py-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{room.name}</p>
                            <p className="text-muted-foreground text-xs">
                              {room.rows} x {room.cols} grid &middot; {room.total_capacity} capacity
                            </p>
                          </div>
                          {room.room_type && (
                            <Badge variant="outline">
                              {ROOM_TYPE_LABELS[room.room_type as RoomType] || room.room_type}
                            </Badge>
                          )}
                        </div>

                        {/* Mini grid preview */}
                        {(() => {
                          const totalCells = room.rows * room.cols
                          const displayCells = Math.min(totalCells, 48)
                          const occupiedRatio = totalCells > 0 ? room.occupied_zone_count / totalCells : 0
                          const filledCount = Math.round(displayCells * occupiedRatio)

                          return (
                            <div
                              className="mt-3 grid gap-0.5"
                              style={{ gridTemplateColumns: `repeat(${Math.min(room.cols, 12)}, minmax(0, 1fr))` }}
                            >
                              {Array.from({ length: displayCells }, (_, i) => (
                                <div
                                  key={i}
                                  className={`aspect-square rounded-sm ${
                                    i < filledCount
                                      ? occupancyPct >= 90
                                        ? "bg-red-500/25 border border-red-500/40"
                                        : occupancyPct >= 60
                                          ? "bg-amber-500/25 border border-amber-500/40"
                                          : "bg-green-500/25 border border-green-500/40"
                                      : "bg-muted/60 border border-dashed border-transparent"
                                  }`}
                                />
                              ))}
                            </div>
                          )
                        })()}

                        {/* Stats row */}
                        <div className="mt-2.5 flex items-center justify-between text-[10px]">
                          <div className="text-muted-foreground flex items-center gap-3">
                            <span>
                              <SproutIcon className="mr-0.5 inline h-3 w-3" />
                              <span className="text-foreground tabular-nums font-medium">{room.active_plant_count}</span> plant{room.active_plant_count !== 1 ? "s" : ""}
                            </span>
                            <span>
                              <LayoutGridIcon className="mr-0.5 inline h-3 w-3" />
                              <span className="text-foreground tabular-nums font-medium">{room.occupied_zone_count}</span>/{room.total_zone_count} zones
                            </span>
                          </div>
                          <span className="text-muted-foreground tabular-nums">
                            {occupancyPct}% full
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}
      <BatchCreateDialog
        open={showBatchCreate}
        onOpenChange={setShowBatchCreate}
        onCreated={async () => {
          const b = await apiClient.getPlantBatches().catch(() => [])
          setBatches(b)
        }}
      />
    </div>
  )
}
