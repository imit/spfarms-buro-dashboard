"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiClient, type Strain, type PlantBatch, GROWTH_PHASE_LABELS } from "@/lib/api"

interface PlantPlacementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roomId: number
  floor: number
  row: number
  col: number
  onPlaced: () => void
}

export function PlantPlacementDialog({
  open,
  onOpenChange,
  roomId,
  floor,
  row,
  col,
  onPlaced,
}: PlantPlacementDialogProps) {
  const [strains, setStrains] = useState<Strain[]>([])
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [strainId, setStrainId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [growthPhase, setGrowthPhase] = useState("immature")
  const [customLabel, setCustomLabel] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    async function load() {
      const [s, b] = await Promise.all([
        apiClient.getStrains(),
        apiClient.getPlantBatches(),
      ])
      setStrains(s)
      setBatches(b)
    }
    load()
  }, [open])

  const selectedBatch = batches.find((b) => String(b.id) === batchId)

  // When a batch is selected, auto-set strain
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
        room_id: roomId,
        strain_id: Number(strainId),
        plant_batch_id: batchId ? Number(batchId) : undefined,
        floor,
        row,
        col,
        growth_phase: growthPhase,
        custom_label: customLabel || undefined,
      })
      onPlaced()
      onOpenChange(false)
      setStrainId("")
      setBatchId("")
      setGrowthPhase("immature")
      setCustomLabel("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place plant")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Place Plant at {String.fromCharCode(65 + col)}{row + 1}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Batch (optional)</Label>
            <Select value={batchId} onValueChange={setBatchId}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Strain</Label>
            <Select value={strainId} onValueChange={setStrainId}>
              <SelectTrigger>
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

          <div className="space-y-2">
            <Label>Growth Phase</Label>
            <Select value={growthPhase} onValueChange={setGrowthPhase}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(GROWTH_PHASE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nickname (optional)</Label>
            <Input
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="e.g. Big Bertha"
            />
          </div>

          {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!strainId || isSubmitting}>
            {isSubmitting ? "Placing..." : "Place Plant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
