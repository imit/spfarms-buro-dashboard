"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Facility, type Harvest, ROOM_TYPE_LABELS, type RoomType } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FacilitySetupForm } from "@/components/grow/facility-setup-form"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PlusIcon, SproutIcon, BoxIcon, ScissorsIcon, LeafIcon, Flower as FlowerIcon, SunIcon, LayersIcon, MoreVerticalIcon, SettingsIcon, ScaleIcon } from "lucide-react"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import Link from "next/link"

export default function GrowPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [facility, setFacility] = useState<Facility | null>(null)
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showSetup, setShowSetup] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const [f, h] = await Promise.all([
          apiClient.getFacility(),
          apiClient.getHarvests().catch(() => []),
        ])
        setFacility(f)
        setHarvests(h)
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
        {facility && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVerticalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/admin/grow/rooms/new">
                  <PlusIcon className="mr-2 h-4 w-4" /> Add Room
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowSetup(true)}>
                <SettingsIcon className="mr-2 h-4 w-4" /> Edit Facility
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
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
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {[
            { label: "Flowering", value: facility.grow_summary.flowering, icon: FlowerIcon, color: "text-pink-500" },
            { label: "Vegetative", value: facility.grow_summary.vegetative, icon: LeafIcon, color: "text-green-500" },
            { label: "Immature", value: facility.grow_summary.immature, icon: SproutIcon, color: "text-emerald-400" },
            { label: "Harvests", value: facility.grow_summary.active_harvests, icon: ScissorsIcon, color: "text-orange-500" },
            { label: "Seeds", value: facility.grow_summary.seed_batches, icon: SunIcon, color: "text-amber-500" },
            { label: "Clones", value: facility.grow_summary.clone_batches, icon: LayersIcon, color: "text-teal-500" },
            { label: "Mothers", value: facility.grow_summary.mother_batches, icon: LeafIcon, color: "text-purple-500" },
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

      {/* Flower Inventory */}
      {facility && <FlowerInventory harvests={harvests} />}
    </div>
  )
}

function gToLbs(grams: number): string {
  return (grams / 453.592).toFixed(2)
}

function FlowerInventory({ harvests }: { harvests: Harvest[] }) {
  const strainMap = new Map<number, { strain_id: number; strain_name: string; flower_grams: number; shake_grams: number; harvests: { id: number; name: string; flower_grams: number; shake_grams: number }[] }>()

  for (const harvest of harvests) {
    for (const hw of harvest.harvest_weights || []) {
      const flower = Number(hw.flower_weight_grams) || 0
      const shake = Number(hw.shake_weight_grams) || 0
      if (flower === 0 && shake === 0) continue

      let entry = strainMap.get(hw.strain_id)
      if (!entry) {
        entry = { strain_id: hw.strain_id, strain_name: hw.strain_name, flower_grams: 0, shake_grams: 0, harvests: [] }
        strainMap.set(hw.strain_id, entry)
      }
      entry.flower_grams += flower
      entry.shake_grams += shake
      entry.harvests.push({ id: harvest.id, name: harvest.name, flower_grams: flower, shake_grams: shake })
    }
  }

  const strains = Array.from(strainMap.values()).sort((a, b) => b.flower_grams - a.flower_grams)
  const grandFlower = strains.reduce((sum, s) => sum + s.flower_grams, 0)
  const grandShake = strains.reduce((sum, s) => sum + s.shake_grams, 0)

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium">Flower Inventory</h2>

      {/* Grand Totals */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <FlowerIcon className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Flower</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{grandFlower.toFixed(1)}g</p>
          <p className="text-sm text-muted-foreground mt-0.5">{gToLbs(grandFlower)} lbs</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <ScaleIcon className="h-4 w-4 text-teal-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Shake</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{grandShake.toFixed(1)}g</p>
          <p className="text-sm text-muted-foreground mt-0.5">{gToLbs(grandShake)} lbs</p>
        </div>
      </div>

      {/* Per-Strain Breakdown */}
      {strains.length === 0 ? (
        <div className="rounded-lg border border-dashed py-8 text-center">
          <FlowerIcon className="text-muted-foreground mx-auto mb-2 h-6 w-6" />
          <p className="text-muted-foreground text-sm">No trimmed flower yet</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
            <span>Strain</span>
            <span className="text-right">Flower</span>
            <span className="text-right">Shake</span>
          </div>
          {strains.map((strain) => (
            <div key={strain.strain_id}>
              <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-3 items-center">
                <div className="flex items-center gap-2.5 min-w-0">
                  <StrainAvatar name={strain.strain_name} size={28} />
                  <div className="min-w-0">
                    <span className="text-sm font-semibold truncate block">{strain.strain_name}</span>
                    <span className="text-muted-foreground text-[10px]">{strain.harvests.length} harvest{strain.harvests.length !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold tabular-nums">{strain.flower_grams.toFixed(1)}g</span>
                  <span className="text-[10px] text-muted-foreground block">{gToLbs(strain.flower_grams)} lbs</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold tabular-nums">{strain.shake_grams.toFixed(1)}g</span>
                  <span className="text-[10px] text-muted-foreground block">{gToLbs(strain.shake_grams)} lbs</span>
                </div>
              </div>
              {strain.harvests.length > 1 && (
                <div className="bg-muted/30 px-4 py-1.5 space-y-1">
                  {strain.harvests.map((h) => (
                    <div key={h.id} className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs text-muted-foreground">
                      <Link href={`/admin/grow/harvests/${h.id}`} className="truncate hover:underline pl-9">
                        {h.name}
                      </Link>
                      <span className="text-right tabular-nums">{h.flower_grams.toFixed(1)}g</span>
                      <span className="text-right tabular-nums">{h.shake_grams.toFixed(1)}g</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
