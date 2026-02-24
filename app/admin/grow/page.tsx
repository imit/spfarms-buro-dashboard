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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusIcon, TagIcon, SproutIcon, LayersIcon, BoxIcon, ScissorsIcon, LeafIcon, Flower as FlowerIcon, SunIcon, MoreVerticalIcon, SettingsIcon, ClockIcon, EyeIcon } from "lucide-react"
import { StrainAvatar } from "@/components/grow/strain-avatar"
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
            <Link href="/admin/grow/harvests">
              <ScissorsIcon className="mr-2 h-4 w-4" /> Harvests
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/grow/tags">
              <TagIcon className="mr-2 h-4 w-4" /> METRC Tags
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/grow/flower">
              <FlowerIcon className="mr-2 h-4 w-4" /> Flower
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/grow/activity">
              <ClockIcon className="mr-2 h-4 w-4" /> Activity
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/grow/observe">
              <EyeIcon className="mr-2 h-4 w-4" /> Observe
            </Link>
          </Button>
          {facility && (
            <Button asChild>
              <Link href="/admin/grow/rooms/new">
                <PlusIcon className="mr-2 h-4 w-4" /> Add Room
              </Link>
            </Button>
          )}
          {facility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVerticalIcon className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setShowSetup(true)}>
                  <SettingsIcon className="mr-2 h-4 w-4" /> Edit Facility
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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

      {/* Facility Info */}
      {facility && !showSetup && (
        <p className="text-muted-foreground text-sm -mt-4">
          {facility.name}
          {facility.license_number && <> &middot; {facility.license_number}</>}
        </p>
      )}

      {/* Grow Summary */}
      {facility && !showSetup && facility.grow_summary && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-7">
          {[
            { label: "Flowering", value: facility.grow_summary.flowering, icon: FlowerIcon, color: "text-pink-500" },
            { label: "Vegetative", value: facility.grow_summary.vegetative, icon: LeafIcon, color: "text-green-500" },
            { label: "Immature", value: facility.grow_summary.immature, icon: SproutIcon, color: "text-emerald-400" },
            { label: "Seeds", value: facility.grow_summary.seed_batches, icon: SunIcon, color: "text-amber-500" },
            { label: "Clones", value: facility.grow_summary.clone_batches, icon: LayersIcon, color: "text-teal-500" },
            { label: "Mothers", value: facility.grow_summary.mother_batches, icon: LeafIcon, color: "text-purple-500" },
            { label: "Harvests", value: facility.grow_summary.active_harvests, icon: ScissorsIcon, color: "text-orange-500" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border bg-card px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                <span className="text-[11px]">{stat.label}</span>
              </div>
              <p className="text-xl font-semibold tabular-nums mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Plant Batches */}
      {facility && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Plant Batches</h2>
            <Button variant="outline" size="sm" onClick={() => setShowBatchCreate(true)}>
              <PlusIcon className="mr-1 h-3.5 w-3.5" /> New Batch
            </Button>
          </div>
          {batches.length === 0 ? (
            <div className="rounded-lg border border-dashed py-6 text-center">
              <LayersIcon className="text-muted-foreground mx-auto mb-1.5 h-6 w-6" />
              <p className="text-muted-foreground text-xs">No batches yet</p>
            </div>
          ) : (
            <div className="rounded-lg border divide-y">
              {batches.map((batch) => {
                const pct = batch.initial_count > 0
                  ? Math.round((batch.active_plant_count / batch.initial_count) * 100)
                  : 0
                const typeColor = batch.batch_type === "seed"
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
                  : batch.batch_type === "clone"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                return (
                  <div key={batch.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                    {/* Stacked avatar */}
                    <div className="relative shrink-0 h-[30px] w-[28px]">
                      <div className="absolute top-0 left-1 opacity-40 scale-90">
                        <StrainAvatar name={batch.strain?.name || "?"} size={24} />
                      </div>
                      <div className="absolute top-[6px] left-0">
                        <StrainAvatar name={batch.strain?.name || "?"} size={24} />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{batch.name}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${typeColor}`}>
                          {BATCH_TYPE_LABELS[batch.batch_type]}
                        </span>
                      </div>
                      <span className="text-muted-foreground text-xs">{batch.strain?.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm tabular-nums font-medium">{batch.active_plant_count}<span className="text-muted-foreground font-normal">/{batch.initial_count}</span></span>
                      </div>
                      <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-500/70 transition-all"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Rooms */}
      {facility && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Rooms</h2>
          {facility.rooms.length === 0 ? (
            <div className="rounded-lg border border-dashed py-8 text-center">
              <BoxIcon className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
              <p className="text-muted-foreground text-sm">No rooms yet. Add your first grow room.</p>
              <Button className="mt-3" size="sm" asChild>
                <Link href="/admin/grow/rooms/new">
                  <PlusIcon className="mr-1 h-3.5 w-3.5" /> Add Room
                </Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {facility.rooms.map((room) => {
                const occupancyPct = room.total_capacity > 0
                  ? Math.round((room.active_plant_count / room.total_capacity) * 100)
                  : 0
                const barColor = occupancyPct >= 90
                  ? "bg-red-500"
                  : occupancyPct >= 60
                    ? "bg-amber-500"
                    : "bg-green-500"

                return (
                  <Link key={room.id} href={`/admin/grow/rooms/${room.id}`}>
                    <div className="group rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{room.name}</h3>
                        {room.room_type && (
                          <span className="text-muted-foreground shrink-0 text-[10px] uppercase tracking-wide">
                            {ROOM_TYPE_LABELS[room.room_type as RoomType] || room.room_type}
                          </span>
                        )}
                      </div>

                      {/* Occupancy bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor} transition-all`}
                            style={{ width: `${Math.min(occupancyPct, 100)}%` }}
                          />
                        </div>
                        <span className="text-muted-foreground text-[11px] tabular-nums shrink-0 w-8 text-right">
                          {occupancyPct}%
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="tabular-nums">
                          <SproutIcon className="mr-0.5 -mt-0.5 inline h-3 w-3" />
                          <span className="text-foreground font-medium">{room.active_plant_count}</span>/{room.total_capacity}
                        </span>
                        <span className="text-muted-foreground/30">&middot;</span>
                        <span>{room.rack_count} rack{room.rack_count !== 1 ? "s" : ""}</span>
                        <span className="text-muted-foreground/30">&middot;</span>
                        <span>{room.tray_count} tray{room.tray_count !== 1 ? "s" : ""}</span>
                        {room.floor_count > 1 && (
                          <>
                            <span className="text-muted-foreground/30">&middot;</span>
                            <span>{room.floor_count}F</span>
                          </>
                        )}
                      </div>
                    </div>
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
