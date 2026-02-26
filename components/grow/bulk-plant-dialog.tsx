"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Progress } from "@/components/ui/progress"
import {
  apiClient,
  type Strain,
  type PlantBatch,
  GROWTH_PHASE_LABELS,
} from "@/lib/api"
import { TagIcon, CheckCircle2Icon, AlertTriangleIcon } from "lucide-react"

const METRC_TAG_REGEX = /^1A4[A-Z0-9]{18,}$/

function parseSuffixes(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length > 0)
}

function buildTags(prefix: string, suffixes: string[]): { valid: string[]; invalid: string[] } {
  const valid: string[] = []
  const invalid: string[] = []
  for (const suffix of suffixes) {
    const tag = `${prefix}${suffix}`
    if (METRC_TAG_REGEX.test(tag)) {
      valid.push(tag)
    } else {
      invalid.push(tag)
    }
  }
  return { valid, invalid }
}

interface BulkPlantDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trayId: number
  trayName: string
  rackName: string
  onCreated: () => void
}

type ResultState = {
  succeeded: string[]
  failed: { tag: string; error: string }[]
}

export function BulkPlantDialog({
  open,
  onOpenChange,
  trayId,
  trayName,
  rackName,
  onCreated,
}: BulkPlantDialogProps) {
  const [strains, setStrains] = useState<Strain[]>([])
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [prefix, setPrefix] = useState("")
  const [suffixInput, setSuffixInput] = useState("")
  const [strainId, setStrainId] = useState("")
  const [batchId, setBatchId] = useState("")
  const [growthPhase, setGrowthPhase] = useState("flowering")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [error, setError] = useState("")
  const [results, setResults] = useState<ResultState | null>(null)

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

  useEffect(() => {
    if (selectedBatch) {
      setStrainId(String(selectedBatch.strain.id))
    }
  }, [selectedBatch])

  const suffixes = useMemo(() => parseSuffixes(suffixInput), [suffixInput])
  const { valid: tags, invalid: invalidTags } = useMemo(
    () => buildTags(prefix.toUpperCase(), suffixes),
    [prefix, suffixes]
  )

  const canSubmit = !!strainId && tags.length > 0 && !isSubmitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setIsSubmitting(true)
    setError("")
    setProgress({ current: 0, total: tags.length })

    const succeeded: string[] = []
    const failed: { tag: string; error: string }[] = []

    for (let i = 0; i < tags.length; i++) {
      setProgress({ current: i + 1, total: tags.length })
      try {
        const plant = await apiClient.createPlant({
          tray_id: trayId,
          strain_id: Number(strainId),
          plant_batch_id: batchId ? Number(batchId) : undefined,
          growth_phase: growthPhase,
        })
        await apiClient.tagPlant(plant.id, tags[i])
        succeeded.push(tags[i])
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        failed.push({ tag: tags[i], error: msg })
      }
    }

    setResults({ succeeded, failed })
    setIsSubmitting(false)
    if (succeeded.length > 0) onCreated()
  }

  const handleClose = () => {
    if (isSubmitting) return
    onOpenChange(false)
    // Reset after close animation
    setTimeout(() => {
      setPrefix("")
      setSuffixInput("")
      setStrainId("")
      setBatchId("")
      setGrowthPhase("flowering")
      setError("")
      setResults(null)
      setProgress({ current: 0, total: 0 })
    }, 200)
  }

  const handleAddMore = () => {
    setSuffixInput("")
    setResults(null)
    setProgress({ current: 0, total: 0 })
  }

  // Results view
  if (results) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {results.failed.length === 0 ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2Icon className="h-5 w-5 text-green-600" />
                  {results.succeeded.length} Plants Created & Tagged
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <AlertTriangleIcon className="h-5 w-5 text-amber-600" />
                  {results.succeeded.length} Created, {results.failed.length} Failed
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <p className="text-muted-foreground text-sm">
              {rackName} &middot; {trayName}
            </p>

            {results.failed.length > 0 && (
              <div className="space-y-1.5 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">Failed Tags</p>
                {results.failed.map((f) => (
                  <div key={f.tag} className="text-xs">
                    <span className="font-mono text-red-600 dark:text-red-400">...{f.tag.slice(-6)}</span>
                    <span className="text-red-400 dark:text-red-500"> — {f.error}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Done
            </Button>
            <Button onClick={handleAddMore}>Add More</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Entry — Add Multiple Plants</DialogTitle>
          <p className="text-muted-foreground text-sm">
            {rackName} &middot; {trayName}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tag Prefix */}
          <div className="space-y-2">
            <Label>Tag Start</Label>
            <div className="flex items-center gap-1.5">
              <TagIcon className="text-muted-foreground h-4 w-4 shrink-0" />
              <Input
                value={prefix}
                onChange={(e) => setPrefix(e.target.value.toUpperCase())}
                placeholder="1A4..."
                className="font-mono"
              />
            </div>
            <p className="text-muted-foreground text-xs">Common part of the METRC tag</p>
          </div>

          {/* Suffixes */}
          <div className="space-y-2">
            <Label>Tag Last Digits</Label>
            <Input
              value={suffixInput}
              onChange={(e) => setSuffixInput(e.target.value)}
              placeholder="232, 322, 333"
              className="font-mono"
            />
            <p className="text-muted-foreground text-xs">Separate multiple with commas</p>
          </div>

          {/* Tag preview */}
          {(tags.length > 0 || invalidTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-green-300 bg-green-50 font-mono text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400">
                  ...{tag.slice(-6)}
                </Badge>
              ))}
              {invalidTags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-red-300 bg-red-50 font-mono text-xs text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400">
                  ...{tag.slice(-6)}
                </Badge>
              ))}
            </div>
          )}

          {/* Batch */}
          <div className="space-y-2">
            <Label>Batch <span className="text-muted-foreground">(optional)</span></Label>
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

          {/* Strain */}
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

          {/* Growth Phase */}
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

          {/* Progress */}
          {isSubmitting && (
            <div className="space-y-2">
              <Progress value={(progress.current / progress.total) * 100} />
              <p className="text-muted-foreground text-center text-sm">
                Creating {progress.current}/{progress.total}...
              </p>
            </div>
          )}

          {error && <ErrorAlert message={error} />}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isSubmitting
              ? `Creating ${progress.current}/${progress.total}...`
              : tags.length > 0
                ? `Create & Tag ${tags.length} Plant${tags.length !== 1 ? "s" : ""}`
                : "Create & Tag Plants"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
