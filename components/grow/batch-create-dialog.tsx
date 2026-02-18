"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient, type Strain, BATCH_TYPE_LABELS, type BatchType } from "@/lib/api"
import { toast } from "sonner"

interface BatchCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function BatchCreateDialog({ open, onOpenChange, onCreated }: BatchCreateDialogProps) {
  const [strains, setStrains] = useState<Strain[]>([])
  const [name, setName] = useState("")
  const [strainId, setStrainId] = useState("")
  const [batchType, setBatchType] = useState<string>("seed")
  const [initialCount, setInitialCount] = useState("10")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    apiClient.getStrains().then(setStrains).catch(() => {})
  }, [open])

  const reset = () => {
    setName("")
    setStrainId("")
    setBatchType("seed")
    setInitialCount("10")
    setNotes("")
    setError("")
  }

  const handleSubmit = async () => {
    if (!name || !strainId || !initialCount) return
    setIsSubmitting(true)
    setError("")

    try {
      await apiClient.createPlantBatch({
        name,
        strain_id: Number(strainId),
        batch_type: batchType,
        initial_count: Number(initialCount),
        notes: notes || undefined,
      })
      toast.success("Batch created")
      reset()
      onCreated()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create batch")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Plant Batch</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Batch Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Wedding Cake Seeds Feb 2026"
            />
          </div>

          <div className="space-y-2">
            <Label>Strain</Label>
            <Select value={strainId} onValueChange={setStrainId}>
              <SelectTrigger><SelectValue placeholder="Select strain..." /></SelectTrigger>
              <SelectContent>
                {strains.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Batch Type</Label>
              <Select value={batchType} onValueChange={setBatchType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(BATCH_TYPE_LABELS) as [BatchType, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Initial Count</Label>
              <Input
                type="number"
                min={1}
                value={initialCount}
                onChange={(e) => setInitialCount(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Batch notes..."
              rows={2}
            />
          </div>

          {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); reset() }}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name || !strainId || !initialCount || isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Batch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
