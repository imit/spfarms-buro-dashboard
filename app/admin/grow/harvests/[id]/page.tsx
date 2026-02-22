"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Harvest, type Facility, type Plant, type AuditEventData, HARVEST_STATUS_LABELS, HARVEST_TYPE_LABELS, type HarvestStatus } from "@/lib/api"
import { AuditEventTimeline } from "@/components/audit-event-timeline"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeftIcon, TagIcon, ScaleIcon, DropletIcon, TrashIcon, WindIcon, CheckCircleIcon, PlusIcon, ScissorsIcon, PackageIcon, Flower as FlowerIcon, ShieldCheckIcon } from "lucide-react"
import Link from "next/link"

function gToLbs(grams: number): string {
  return (grams / 453.592).toFixed(2)
}

const STATUS_COLORS: Record<HarvestStatus, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  drying: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  dried: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  trimming: "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  curing: "bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-300",
  packaged: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
}

function StrainWeightsSection({ harvest, onUpdate }: { harvest: Harvest; onUpdate: (h: Harvest) => void }) {
  const [editingStrain, setEditingStrain] = useState<number | null>(null)
  const [wetVal, setWetVal] = useState("")
  const [dryVal, setDryVal] = useState("")
  const [wasteVal, setWasteVal] = useState("")
  const [flowerVal, setFlowerVal] = useState("")
  const [shakeVal, setShakeVal] = useState("")
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState("")

  const strains = harvest.strains_in_harvest || []
  const weightMap = new Map(
    (harvest.harvest_weights || []).map((hw) => [hw.strain_id, hw])
  )

  const hasTrimmingData = (harvest.harvest_weights || []).some((hw) => hw.flower_weight_grams != null || hw.shake_weight_grams != null)
  const showTrimCols = hasTrimmingData || ["trimming", "curing", "packaged", "closed"].includes(harvest.status)

  const startEdit = (strainId: number) => {
    const existing = weightMap.get(strainId)
    setEditingStrain(strainId)
    setWetVal(existing?.wet_weight_grams != null ? String(existing.wet_weight_grams) : "")
    setDryVal(existing?.dry_weight_grams != null ? String(existing.dry_weight_grams) : "")
    setWasteVal(existing?.waste_weight_grams != null ? String(existing.waste_weight_grams) : "")
    setFlowerVal(existing?.flower_weight_grams != null ? String(existing.flower_weight_grams) : "")
    setShakeVal(existing?.shake_weight_grams != null ? String(existing.shake_weight_grams) : "")
    setErr("")
  }

  const handleSave = async () => {
    if (editingStrain == null) return
    setSaving(true)
    setErr("")
    try {
      const h = await apiClient.recordStrainWeight(harvest.id, {
        strain_id: editingStrain,
        wet_weight_grams: wetVal ? Number(wetVal) : undefined,
        dry_weight_grams: dryVal ? Number(dryVal) : undefined,
        waste_weight_grams: wasteVal ? Number(wasteVal) : undefined,
        flower_weight_grams: flowerVal ? Number(flowerVal) : undefined,
        shake_weight_grams: shakeVal ? Number(shakeVal) : undefined,
      })
      onUpdate(h)
      setEditingStrain(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  if (strains.length === 0) return null

  const gridCols = showTrimCols
    ? "grid-cols-[1fr_70px_70px_70px_70px_70px_50px]"
    : "grid-cols-[1fr_80px_80px_80px_60px]"

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Weights by Strain</h2>
      <div className="rounded-lg border divide-y">
        {/* Header */}
        <div className={`grid ${gridCols} gap-2 px-3 py-2 bg-muted/50 text-xs font-medium text-muted-foreground`}>
          <span>Strain</span>
          <span className="text-right">Wet (g)</span>
          <span className="text-right">Dry (g)</span>
          <span className="text-right">Waste (g)</span>
          {showTrimCols && <span className="text-right">Flower (g)</span>}
          {showTrimCols && <span className="text-right">Shake (g)</span>}
          <span />
        </div>
        {strains.map((strain) => {
          const hw = weightMap.get(strain.id)
          const isEditing = editingStrain === strain.id
          const plantCount = harvest.harvest_plants.filter((hp) => hp.strain_id === strain.id).length

          return (
            <div key={strain.id}>
              <div className={`grid ${gridCols} gap-2 px-3 py-2.5 items-center`}>
                <div className="flex items-center gap-2 min-w-0">
                  <StrainAvatar name={strain.name} size={22} />
                  <div className="min-w-0">
                    <span className="text-sm font-medium truncate block">{strain.name}</span>
                    <span className="text-muted-foreground text-[10px]">{plantCount} plant{plantCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <span className="text-sm tabular-nums text-right">{hw?.wet_weight_grams != null ? hw.wet_weight_grams : "—"}</span>
                <span className="text-sm tabular-nums text-right">{hw?.dry_weight_grams != null ? hw.dry_weight_grams : "—"}</span>
                <span className="text-sm tabular-nums text-right">{hw?.waste_weight_grams != null ? hw.waste_weight_grams : "—"}</span>
                {showTrimCols && <span className="text-sm tabular-nums text-right">{hw?.flower_weight_grams != null ? hw.flower_weight_grams : "—"}</span>}
                {showTrimCols && <span className="text-sm tabular-nums text-right">{hw?.shake_weight_grams != null ? hw.shake_weight_grams : "—"}</span>}
                <div className="text-right">
                  <button
                    onClick={() => startEdit(strain.id)}
                    className="text-[11px] text-muted-foreground hover:text-foreground"
                  >
                    {hw ? "Edit" : "Record"}
                  </button>
                </div>
              </div>
              {isEditing && (
                <div className="px-3 pb-3 space-y-2">
                  <div className="flex items-end gap-2 flex-wrap">
                    <div className="space-y-1">
                      <Label className="text-[10px]">Wet (g)</Label>
                      <Input type="number" value={wetVal} onChange={(e) => setWetVal(e.target.value)} placeholder="grams" className="h-7 text-xs w-20" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Dry (g)</Label>
                      <Input type="number" value={dryVal} onChange={(e) => setDryVal(e.target.value)} placeholder="grams" className="h-7 text-xs w-20" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px]">Waste (g)</Label>
                      <Input type="number" value={wasteVal} onChange={(e) => setWasteVal(e.target.value)} placeholder="grams" className="h-7 text-xs w-20" />
                    </div>
                    {showTrimCols && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Flower (g)</Label>
                          <Input type="number" value={flowerVal} onChange={(e) => setFlowerVal(e.target.value)} placeholder="grams" className="h-7 text-xs w-20" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Shake (g)</Label>
                          <Input type="number" value={shakeVal} onChange={(e) => setShakeVal(e.target.value)} placeholder="grams" className="h-7 text-xs w-20" />
                        </div>
                      </>
                    )}
                    <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving}>
                      {saving ? "..." : "Save"}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingStrain(null)}>
                      Cancel
                    </Button>
                  </div>
                  {err && <p className="text-destructive text-xs">{err}</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HarvestDetailPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const isAdmin = user?.role === "admin"
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [harvest, setHarvest] = useState<Harvest | null>(null)
  const [facility, setFacility] = useState<Facility | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [auditEvents, setAuditEvents] = useState<AuditEventData[]>([])

  const [isSaving, setIsSaving] = useState(false)

  // Drying flow
  const [showDryingForm, setShowDryingForm] = useState(false)
  const [dryingRoomId, setDryingRoomId] = useState("")
  const [strainWetInputs, setStrainWetInputs] = useState<Record<number, string>>({})
  const [strainWasteInputs, setStrainWasteInputs] = useState<Record<number, string>>({})
  const [showFinishDryingForm, setShowFinishDryingForm] = useState(false)
  const [strainDryInputs, setStrainDryInputs] = useState<Record<number, string>>({})

  // Trimming flow
  const [showTrimmingForm, setShowTrimmingForm] = useState(false)
  const [strainFlowerInputs, setStrainFlowerInputs] = useState<Record<number, string>>({})
  const [strainShakeInputs, setStrainShakeInputs] = useState<Record<number, string>>({})
  const [strainTrimWasteInputs, setStrainTrimWasteInputs] = useState<Record<number, string>>({})

  // Add plants flow
  const [showAddPlants, setShowAddPlants] = useState(false)
  const [availablePlants, setAvailablePlants] = useState<Plant[]>([])
  const [addPlantIds, setAddPlantIds] = useState<Set<number>>(new Set())
  const [loadingPlants, setLoadingPlants] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const [h, f, evts] = await Promise.all([
          apiClient.getHarvest(id),
          apiClient.getFacility().catch(() => null),
          apiClient.getHarvestAuditEvents(id).catch(() => []),
        ])
        setHarvest(h)
        setFacility(f)
        setAuditEvents(evts)
      } catch {
        setError("Failed to load harvest")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, id])

  const dryingRooms = facility?.rooms.filter((r) => r.room_type === "dry" || r.room_type === "cure") || []

  const handleStartDrying = async () => {
    const needsWet = !harvest?.wet_weight_grams
    const strains = harvest?.strains_in_harvest || []

    // Validate: every strain needs a wet weight if totals aren't recorded yet
    if (needsWet) {
      const allFilled = strains.every((s) => strainWetInputs[s.id] && Number(strainWetInputs[s.id]) > 0)
      if (!allFilled) {
        setError("Wet weight is required for each strain before moving to drying")
        return
      }
    }

    setIsSaving(true)
    setError("")
    try {
      // Record per-strain wet + waste weights
      for (const strain of strains) {
        const wetVal = needsWet ? strainWetInputs[strain.id] : undefined
        const wasteVal = strainWasteInputs[strain.id]
        if (wetVal || wasteVal) {
          await apiClient.recordStrainWeight(id, {
            strain_id: strain.id,
            wet_weight_grams: wetVal ? Number(wetVal) : undefined,
            waste_weight_grams: wasteVal ? Number(wasteVal) : undefined,
          })
        }
      }
      const h = await apiClient.startDrying(id, dryingRoomId ? Number(dryingRoomId) : undefined)
      setHarvest(h)
      setShowDryingForm(false)
      setDryingRoomId("")
      setStrainWetInputs({})
      setStrainWasteInputs({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start drying")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinishDrying = async () => {
    const strains = harvest?.strains_in_harvest || []
    // Validate: every strain needs a dry weight
    const allFilled = strains.every((s) => strainDryInputs[s.id] && Number(strainDryInputs[s.id]) > 0)
    if (!allFilled) {
      setError("Dry weight is required for each strain")
      return
    }

    setIsSaving(true)
    setError("")
    try {
      // Record per-strain dry weights
      for (const strain of strains) {
        const dryVal = strainDryInputs[strain.id]
        if (dryVal) {
          await apiClient.recordStrainWeight(id, {
            strain_id: strain.id,
            dry_weight_grams: Number(dryVal),
          })
        }
      }

      // Now finish drying — totals are already summed on the backend
      const totalDry = Object.values(strainDryInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
      const h = await apiClient.finishDrying(id, {
        dry_weight_grams: totalDry > 0 ? totalDry : undefined,
      })
      setHarvest(h)
      setShowFinishDryingForm(false)
      setStrainDryInputs({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish drying")
    } finally {
      setIsSaving(false)
    }
  }

  const handleStartTrimming = async () => {
    setIsSaving(true)
    setError("")
    try {
      const h = await apiClient.startTrimming(id)
      setHarvest(h)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start trimming")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinishTrimming = async () => {
    const strains = harvest?.strains_in_harvest || []
    const allFilled = strains.every((s) => strainFlowerInputs[s.id] && Number(strainFlowerInputs[s.id]) > 0)
    if (!allFilled) {
      setError("Flower weight is required for each strain")
      return
    }

    setIsSaving(true)
    setError("")
    try {
      for (const strain of strains) {
        await apiClient.recordStrainWeight(id, {
          strain_id: strain.id,
          flower_weight_grams: Number(strainFlowerInputs[strain.id]),
          shake_weight_grams: strainShakeInputs[strain.id] ? Number(strainShakeInputs[strain.id]) : undefined,
          waste_weight_grams: strainTrimWasteInputs[strain.id] ? Number(strainTrimWasteInputs[strain.id]) : undefined,
        })
      }
      const h = await apiClient.finishTrimming(id)
      setHarvest(h)
      setShowTrimmingForm(false)
      setStrainFlowerInputs({})
      setStrainShakeInputs({})
      setStrainTrimWasteInputs({})
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish trimming")
    } finally {
      setIsSaving(false)
    }
  }

  const handleFinishCuring = async () => {
    setIsSaving(true)
    setError("")
    try {
      const h = await apiClient.finishCuring(id)
      setHarvest(h)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish curing")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAdminReview = async () => {
    setIsSaving(true)
    setError("")
    try {
      const h = await apiClient.adminReviewHarvest(id)
      setHarvest(h)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to review harvest")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCloseHarvest = async () => {
    setIsSaving(true)
    setError("")
    try {
      const h = await apiClient.closeHarvest(id)
      setHarvest(h)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to close harvest")
    } finally {
      setIsSaving(false)
    }
  }

  const handleOpenAddPlants = async () => {
    setShowAddPlants(true)
    setLoadingPlants(true)
    setAddPlantIds(new Set())
    try {
      const plants = await apiClient.getPlants({ growth_phase: "flowering" })
      // Exclude plants already in this harvest
      const existingIds = new Set(harvest?.harvest_plants.map((hp) => hp.plant_id) ?? [])
      setAvailablePlants(plants.filter((p) => !existingIds.has(p.id)))
    } catch {
      setError("Failed to load available plants")
    } finally {
      setLoadingPlants(false)
    }
  }

  const handleAddPlants = async () => {
    if (addPlantIds.size === 0) return
    setIsSaving(true)
    setError("")
    try {
      const h = await apiClient.addPlantsToHarvest(id, Array.from(addPlantIds))
      setHarvest(h)
      setShowAddPlants(false)
      setAddPlantIds(new Set())
      setAvailablePlants([])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add plants")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleAddPlant = (plantId: number) => {
    setAddPlantIds((prev) => {
      const next = new Set(prev)
      if (next.has(plantId)) next.delete(plantId)
      else next.add(plantId)
      return next
    })
  }

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!harvest) return <div className="p-6"><p className="text-destructive">{error || "Harvest not found"}</p></div>

  const progressSteps: HarvestStatus[] = ["active", "drying", "dried", "trimming", "curing", "packaged", "closed"]
  const currentStepIdx = progressSteps.indexOf(harvest.status)

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow/harvests"><ArrowLeftIcon className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <StrainAvatar name={harvest.strain?.name || "?"} size={32} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-semibold">{harvest.name}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[harvest.status]}`}>
                  {HARVEST_STATUS_LABELS[harvest.status]}
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                {harvest.strain?.name} &middot; {HARVEST_TYPE_LABELS[harvest.harvest_type]} &middot; {harvest.plant_count} plant{harvest.plant_count !== 1 ? "s" : ""} &middot; {harvest.harvest_date}
                {harvest.total_days != null && <> &middot; Day {harvest.total_days}</>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Progress */}
      <div className="flex items-center gap-1">
        {progressSteps.map((step, i) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`h-1.5 flex-1 rounded-full ${i <= currentStepIdx ? "bg-green-500" : "bg-muted"}`} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground -mt-4 px-1">
        {progressSteps.map((step) => (
          <span key={step} className={step === harvest.status ? "text-foreground font-medium" : ""}>
            {HARVEST_STATUS_LABELS[step]}
          </span>
        ))}
      </div>

      {/* Next Step Action Card — contextual based on status */}
      {harvest.status === "active" && (
        <div className="rounded-lg border-2 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <WindIcon className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Next Step: Move to Drying</span>
          </div>
          {!showDryingForm ? (
            <div className="space-y-2">
              {!harvest.wet_weight_grams ? (
                <p className="text-muted-foreground text-xs">Record wet weights per strain before moving to drying.</p>
              ) : (
                <p className="text-muted-foreground text-xs">Wet weight recorded ({harvest.wet_weight_grams}g). Ready to move to drying.</p>
              )}
              <Button size="sm" onClick={() => setShowDryingForm(true)}>
                Start Drying
              </Button>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {!harvest.wet_weight_grams && (
                <div className="space-y-2">
                  <Label className="text-xs">Weights per Strain</Label>
                  {(harvest.strains_in_harvest || []).map((strain) => {
                    const plantCount = harvest.harvest_plants.filter((hp) => hp.strain_id === strain.id).length
                    return (
                      <div key={strain.id} className="flex items-center gap-2">
                        <StrainAvatar name={strain.name} size={20} />
                        <span className="text-xs min-w-0 flex-1 truncate">
                          {strain.name} <span className="text-muted-foreground">({plantCount})</span>
                        </span>
                        <Input
                          type="number"
                          value={strainWetInputs[strain.id] || ""}
                          onChange={(e) => setStrainWetInputs((prev) => ({ ...prev, [strain.id]: e.target.value }))}
                          placeholder="Wet (g) *"
                          className="h-7 text-xs w-24"
                        />
                        <Input
                          type="number"
                          value={strainWasteInputs[strain.id] || ""}
                          onChange={(e) => setStrainWasteInputs((prev) => ({ ...prev, [strain.id]: e.target.value }))}
                          placeholder="Waste (g)"
                          className="h-7 text-xs w-24"
                        />
                      </div>
                    )
                  })}
                  {Object.values(strainWetInputs).some((v) => v) && (
                    <p className="text-[11px] text-muted-foreground">
                      Total wet: {Object.values(strainWetInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)}g
                      {Object.values(strainWasteInputs).some((v) => v) && (
                        <> &middot; Total waste: {Object.values(strainWasteInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)}g</>
                      )}
                    </p>
                  )}
                </div>
              )}
              {dryingRooms.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Drying Room</Label>
                  <Select value={dryingRoomId} onValueChange={setDryingRoomId}>
                    <SelectTrigger className="h-8 text-xs w-60">
                      <SelectValue placeholder="Select drying room..." />
                    </SelectTrigger>
                    <SelectContent>
                      {dryingRooms.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleStartDrying} disabled={isSaving || (!harvest.wet_weight_grams && !(harvest.strains_in_harvest || []).every((s) => strainWetInputs[s.id] && Number(strainWetInputs[s.id]) > 0))}>
                  {isSaving ? "Starting..." : "Confirm Start Drying"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowDryingForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {harvest.status === "drying" && (
        <div className="rounded-lg border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <WindIcon className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Drying in Progress</span>
          </div>
          {/* Drying progress */}
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all"
                style={{ width: `${Math.min(((harvest.drying_days ?? 0) / 14) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm tabular-nums text-muted-foreground shrink-0">
              Day {harvest.drying_days ?? 0}/14
            </span>
          </div>
          {harvest.drying_room && (
            <p className="text-xs text-muted-foreground mb-3">Location: {harvest.drying_room.name}</p>
          )}
          {!showFinishDryingForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowFinishDryingForm(true)}>
              <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" /> Finish Drying
            </Button>
          ) : (
            <div className="space-y-3 mt-2 rounded-lg border bg-background p-3">
              <p className="text-xs font-medium">Record final weights per strain and mark as dried</p>
              <div className="space-y-2">
                {(harvest.strains_in_harvest || []).map((strain) => {
                  const plantCount = harvest.harvest_plants.filter((hp) => hp.strain_id === strain.id).length
                  const hw = (harvest.harvest_weights || []).find((w) => w.strain_id === strain.id)
                  return (
                    <div key={strain.id} className="flex items-center gap-2">
                      <StrainAvatar name={strain.name} size={20} />
                      <span className="text-xs min-w-0 flex-1 truncate">
                        {strain.name} <span className="text-muted-foreground">({plantCount})</span>
                        {hw?.wet_weight_grams != null && (
                          <span className="text-muted-foreground ml-1">{hw.wet_weight_grams}g wet</span>
                        )}
                      </span>
                      <Input
                        type="number"
                        value={strainDryInputs[strain.id] || ""}
                        onChange={(e) => setStrainDryInputs((prev) => ({ ...prev, [strain.id]: e.target.value }))}
                        placeholder="Dry weight (g)"
                        className="h-7 text-xs w-28"
                      />
                    </div>
                  )
                })}
              </div>
              {(() => {
                const totalDry = Object.values(strainDryInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
                return totalDry > 0 ? (
                  <div className="text-[11px] text-muted-foreground space-y-0.5">
                    <p>Total dry: {totalDry}g</p>
                    {harvest.wet_weight_grams != null && (
                      <p>Water loss: {((1 - totalDry / harvest.wet_weight_grams) * 100).toFixed(1)}% from {harvest.wet_weight_grams}g wet</p>
                    )}
                  </div>
                ) : null
              })()}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFinishDrying} disabled={isSaving || !(harvest.strains_in_harvest || []).every((s) => strainDryInputs[s.id] && Number(strainDryInputs[s.id]) > 0)}>
                  {isSaving ? "Saving..." : "Mark as Dried"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowFinishDryingForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {harvest.status === "dried" && (
        <div className="rounded-lg border-2 border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircleIcon className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Drying Complete</span>
          </div>
          <p className="text-muted-foreground text-xs mb-3">
            Dried for {harvest.drying_days ?? "?"} days.
            {harvest.dry_weight_loss_pct != null && <> Weight loss: {harvest.dry_weight_loss_pct}%.</>}
          </p>
          <Button size="sm" onClick={handleStartTrimming} disabled={isSaving}>
            <ScissorsIcon className="mr-1.5 h-3.5 w-3.5" /> Start Trimming
          </Button>
        </div>
      )}

      {harvest.status === "trimming" && (
        <div className="rounded-lg border-2 border-violet-200 dark:border-violet-900 bg-violet-50/50 dark:bg-violet-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ScissorsIcon className="h-4 w-4 text-violet-500" />
            <span className="text-sm font-medium">Trimming in Progress</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-sm tabular-nums text-muted-foreground">
              Day {harvest.trimming_days ?? 0}
            </span>
          </div>
          {!showTrimmingForm ? (
            <Button size="sm" variant="outline" onClick={() => setShowTrimmingForm(true)}>
              <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" /> Finish Trimming
            </Button>
          ) : (
            <div className="space-y-3 mt-2 rounded-lg border bg-background p-3">
              <p className="text-xs font-medium">Record trim weights per strain</p>
              <div className="space-y-2">
                {/* Column headers */}
                <div className="grid grid-cols-[1fr_96px_96px_96px] gap-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                  <span>Strain</span>
                  <span>Flower (g) *</span>
                  <span>Shake (g)</span>
                  <span>Waste (g)</span>
                </div>
                {(harvest.strains_in_harvest || []).map((strain) => {
                  const hw = (harvest.harvest_weights || []).find((w) => w.strain_id === strain.id)
                  return (
                    <div key={strain.id} className="grid grid-cols-[1fr_96px_96px_96px] gap-2 items-center">
                      <div className="flex items-center gap-2 min-w-0">
                        <StrainAvatar name={strain.name} size={20} />
                        <span className="text-xs min-w-0 truncate">
                          {strain.name}
                          {hw?.dry_weight_grams != null && (
                            <span className="text-muted-foreground ml-1">{hw.dry_weight_grams}g dry</span>
                          )}
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={strainFlowerInputs[strain.id] || ""}
                        onChange={(e) => setStrainFlowerInputs((prev) => ({ ...prev, [strain.id]: e.target.value }))}
                        className="h-7 text-xs"
                      />
                      <Input
                        type="number"
                        value={strainShakeInputs[strain.id] || ""}
                        onChange={(e) => setStrainShakeInputs((prev) => ({ ...prev, [strain.id]: e.target.value }))}
                        className="h-7 text-xs"
                      />
                      <Input
                        type="number"
                        value={strainTrimWasteInputs[strain.id] || ""}
                        onChange={(e) => setStrainTrimWasteInputs((prev) => ({ ...prev, [strain.id]: e.target.value }))}
                        className="h-7 text-xs"
                      />
                    </div>
                  )
                })}
              </div>
              {(() => {
                const totalFlower = Object.values(strainFlowerInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
                const totalShake = Object.values(strainShakeInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
                const totalWaste = Object.values(strainTrimWasteInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
                return totalFlower > 0 ? (
                  <p className="text-[11px] text-muted-foreground">
                    Total flower: {totalFlower}g
                    {totalShake > 0 && <> &middot; Shake: {totalShake}g</>}
                    {totalWaste > 0 && <> &middot; Waste: {totalWaste}g</>}
                  </p>
                ) : null
              })()}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleFinishTrimming} disabled={isSaving || !(harvest.strains_in_harvest || []).every((s) => strainFlowerInputs[s.id] && Number(strainFlowerInputs[s.id]) > 0)}>
                  {isSaving ? "Saving..." : "Finish Trimming & Start Curing"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowTrimmingForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {harvest.status === "curing" && (
        <div className="rounded-lg border-2 border-pink-200 dark:border-pink-900 bg-pink-50/50 dark:bg-pink-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PackageIcon className="h-4 w-4 text-pink-500" />
            <span className="text-sm font-medium">Curing in Progress</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-pink-500 transition-all"
                style={{ width: `${Math.min(((harvest.curing_days ?? 0) / 30) * 100, 100)}%` }}
              />
            </div>
            <span className="text-sm tabular-nums text-muted-foreground shrink-0">
              Day {harvest.curing_days ?? 0}/30
            </span>
          </div>
          {harvest.flower_weight_grams != null && (
            <p className="text-xs text-muted-foreground mb-3">
              Flower: {harvest.flower_weight_grams}g
              {harvest.shake_weight_grams != null && <> &middot; Shake: {harvest.shake_weight_grams}g</>}
            </p>
          )}
          <Button size="sm" variant="outline" onClick={handleFinishCuring} disabled={isSaving}>
            <CheckCircleIcon className="mr-1.5 h-3.5 w-3.5" /> {isSaving ? "Finishing..." : "Finish Curing"}
          </Button>
        </div>
      )}

      {harvest.status === "packaged" && (
        <div className="rounded-lg border-2 border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <PackageIcon className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Packaged</span>
          </div>

          {harvest.admin_reviewed_at ? (
            <>
              <div className="flex items-center gap-2 mb-3 text-xs text-green-600 dark:text-green-400">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                <span>
                  Reviewed by {harvest.admin_reviewed_by?.full_name || harvest.admin_reviewed_by?.email} on{" "}
                  {new Date(harvest.admin_reviewed_at).toLocaleDateString()}
                </span>
              </div>
              {isAdmin && (
                <Button size="sm" variant="outline" onClick={handleCloseHarvest} disabled={isSaving}>
                  {isSaving ? "Closing..." : "Close Harvest"}
                </Button>
              )}
              {!isAdmin && (
                <p className="text-muted-foreground text-xs">Waiting for an admin to close this harvest.</p>
              )}
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-xs mb-3">
                An admin must review and approve this harvest before it can be closed.
              </p>
              {isAdmin ? (
                <Button size="sm" onClick={handleAdminReview} disabled={isSaving}>
                  <ShieldCheckIcon className="mr-1.5 h-3.5 w-3.5" />
                  {isSaving ? "Reviewing..." : "Approve & Review"}
                </Button>
              ) : (
                <p className="text-xs text-amber-600 dark:text-amber-400">Waiting for admin review.</p>
              )}
            </>
          )}
        </div>
      )}

      {/* Weight Totals */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <DropletIcon className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Wet</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{harvest.wet_weight_grams != null ? `${harvest.wet_weight_grams}g` : "—"}</p>
          {harvest.wet_weight_grams != null && (
            <p className="text-xs text-muted-foreground mt-0.5">{gToLbs(harvest.wet_weight_grams)} lbs</p>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <ScaleIcon className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Dry</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{harvest.dry_weight_grams != null ? `${harvest.dry_weight_grams}g` : "—"}</p>
          {harvest.dry_weight_grams != null && (
            <p className="text-xs text-muted-foreground mt-0.5">{gToLbs(harvest.dry_weight_grams)} lbs{harvest.dry_weight_loss_pct != null && ` · ${harvest.dry_weight_loss_pct}% loss`}</p>
          )}
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrashIcon className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Waste</span>
          </div>
          <p className="text-2xl font-semibold tabular-nums">{harvest.waste_weight_grams != null ? `${harvest.waste_weight_grams}g` : "—"}</p>
          {harvest.waste_weight_grams != null && (
            <p className="text-xs text-muted-foreground mt-0.5">{gToLbs(harvest.waste_weight_grams)} lbs</p>
          )}
        </div>
        {(harvest.flower_weight_grams != null || harvest.shake_weight_grams != null) && (
          <>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-1">
                <FlowerIcon className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Flower</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums">{harvest.flower_weight_grams != null ? `${harvest.flower_weight_grams}g` : "—"}</p>
              {harvest.flower_weight_grams != null && (
                <p className="text-xs text-muted-foreground mt-0.5">{gToLbs(harvest.flower_weight_grams)} lbs</p>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-1">
                <ScaleIcon className="h-4 w-4 text-teal-500" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Shake</span>
              </div>
              <p className="text-2xl font-semibold tabular-nums">{harvest.shake_weight_grams != null ? `${harvest.shake_weight_grams}g` : "—"}</p>
              {harvest.shake_weight_grams != null && (
                <p className="text-xs text-muted-foreground mt-0.5">{gToLbs(harvest.shake_weight_grams)} lbs</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Weights by Strain */}
      <StrainWeightsSection harvest={harvest} onUpdate={setHarvest} />

      {/* Harvested Plants */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Harvested Plants ({harvest.harvest_plants.length})</h2>
          {harvest.status === "active" && (
            <Button variant="outline" size="sm" onClick={handleOpenAddPlants}>
              <PlusIcon className="mr-1 h-3.5 w-3.5" /> Add Plants
            </Button>
          )}
        </div>

        {/* Add Plants Picker */}
        {showAddPlants && (
          <div className="rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-900 p-3 space-y-3">
            <p className="text-xs font-medium">Select flowering plants to add to this harvest</p>
            {loadingPlants ? (
              <p className="text-muted-foreground text-xs">Loading available plants...</p>
            ) : availablePlants.length === 0 ? (
              <p className="text-muted-foreground text-xs">No additional flowering plants available.</p>
            ) : (
              <div className="rounded-lg border divide-y max-h-[300px] overflow-y-auto">
                {availablePlants.map((plant) => (
                  <label
                    key={plant.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={addPlantIds.has(plant.id)}
                      onCheckedChange={() => toggleAddPlant(plant.id)}
                    />
                    <StrainAvatar name={plant.strain.name} size={20} />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{plant.strain.name}</span>
                      <span className="text-muted-foreground text-[10px] ml-1.5">{plant.plant_uid}</span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{plant.room?.name || "—"}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddPlants} disabled={isSaving || addPlantIds.size === 0}>
                {isSaving ? "Adding..." : `Add ${addPlantIds.size} Plant${addPlantIds.size !== 1 ? "s" : ""}`}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => { setShowAddPlants(false); setAddPlantIds(new Set()) }}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-lg border divide-y">
          {harvest.harvest_plants.map((hp) => (
            <div key={hp.id} className="flex items-center gap-3 px-3 py-2">
              <StrainAvatar name={hp.strain_name} size={22} />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-medium">{hp.strain_name}</span>
                <span className="text-muted-foreground text-xs ml-2">{hp.plant_uid}</span>
              </div>
              {hp.metrc_label && (
                <span className="text-xs text-muted-foreground font-mono">
                  <TagIcon className="inline h-3 w-3 mr-0.5" />{hp.metrc_label.slice(-8)}
                </span>
              )}
              {hp.wet_weight_grams != null && (
                <span className="text-xs text-muted-foreground tabular-nums">{hp.wet_weight_grams}g</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {harvest.notes && (
        <div className="space-y-1">
          <h2 className="text-lg font-medium">Notes</h2>
          <p className="text-sm text-muted-foreground">{harvest.notes}</p>
        </div>
      )}

      {/* Activity Log */}
      {auditEvents.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Activity Log</h2>
          <div className="rounded-lg border p-3">
            <AuditEventTimeline events={auditEvents} />
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>UID: {harvest.harvest_uid}</p>
        {harvest.created_by && <p>Created by: {harvest.created_by.full_name || harvest.created_by.email}</p>}
        {harvest.drying_started_at && <p>Drying started: {new Date(harvest.drying_started_at).toLocaleDateString()}</p>}
        {harvest.dried_at && <p>Dried: {new Date(harvest.dried_at).toLocaleDateString()}</p>}
        {harvest.trimming_started_at && <p>Trimming started: {new Date(harvest.trimming_started_at).toLocaleDateString()}</p>}
        {harvest.trimming_finished_at && <p>Trimming finished: {new Date(harvest.trimming_finished_at).toLocaleDateString()}</p>}
        {harvest.curing_started_at && <p>Curing started: {new Date(harvest.curing_started_at).toLocaleDateString()}</p>}
        {harvest.curing_finished_at && <p>Curing finished: {new Date(harvest.curing_finished_at).toLocaleDateString()}</p>}
        {harvest.metrc_id && <p>METRC ID: {harvest.metrc_id}</p>}
        {harvest.metrc_tag && <p>METRC Tag: {harvest.metrc_tag}</p>}
      </div>

      {error && <p className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">{error}</p>}
    </div>
  )
}
