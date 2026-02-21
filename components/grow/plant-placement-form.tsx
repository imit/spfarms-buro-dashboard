"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, type Strain, type PlantBatch, GROWTH_PHASE_LABELS } from "@/lib/api"
import { TagIcon } from "lucide-react"

interface PlantPlacementFormProps {
  trayId: number
  onPlaced: () => void
  onCancel: () => void
}

export function PlantPlacementForm({ trayId, onPlaced, onCancel }: PlantPlacementFormProps) {
  const [strains, setStrains] = useState<Strain[]>([])
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [strainId, setStrainId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [growthPhase, setGrowthPhase] = useState("immature")
  const [metrcLabel, setMetrcLabel] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      const [s, b] = await Promise.all([
        apiClient.getStrains(),
        apiClient.getPlantBatches(),
      ])
      setStrains(s)
      setBatches(b)
    }
    load()
  }, [])

  const selectedBatch = batches.find((b) => String(b.id) === batchId)

  useEffect(() => {
    if (selectedBatch) {
      setStrainId(String(selectedBatch.strain.id))
    }
  }, [selectedBatch])

  const handleSubmit = async () => {
    if (!strainId) return
    setIsSubmitting(true)
    setError("")

    try {
      await apiClient.createPlant({
        tray_id: trayId,
        strain_id: Number(strainId),
        plant_batch_id: batchId ? Number(batchId) : undefined,
        growth_phase: growthPhase,
        metrc_label: metrcLabel || undefined,
      })
      setStrainId("")
      setBatchId("")
      setGrowthPhase("immature")
      setMetrcLabel("")
      setError("")
      onPlaced()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place plant")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <p className="text-sm font-medium">Add Plant</p>

      <div className="space-y-1.5">
        <Label className="text-xs">Batch (optional)</Label>
        <Select value={batchId} onValueChange={setBatchId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select a batch..." />
          </SelectTrigger>
          <SelectContent>
            {batches.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.name} ({b.strain?.name}) &middot; {b.active_plant_count}/{b.initial_count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Strain</Label>
        <Select value={strainId} onValueChange={setStrainId}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select strain..." />
          </SelectTrigger>
          <SelectContent>
            {strains.filter((s) => s.active).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Growth Phase</Label>
        <Select value={growthPhase} onValueChange={setGrowthPhase}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GROWTH_PHASE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">METRC Tag <span className="text-muted-foreground">(optional)</span></Label>
        <div className="flex items-center gap-1.5">
          <TagIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          <Input
            value={metrcLabel}
            onChange={(e) => setMetrcLabel(e.target.value)}
            placeholder="e.g. 1A40F00..."
            className="h-8 font-mono text-xs"
          />
        </div>
      </div>

      {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-xs">{error}</p>}

      <div className="flex gap-2">
        <Button size="sm" onClick={handleSubmit} disabled={!strainId || isSubmitting} className="flex-1">
          {isSubmitting ? "Placing..." : "Place Plant"}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
