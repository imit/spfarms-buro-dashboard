"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { apiClient } from "@/lib/api"

interface TagImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

export function TagImportDialog({ open, onOpenChange, onImported }: TagImportDialogProps) {
  const [rawTags, setRawTags] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ created_count: number; error_count: number } | null>(null)
  const [error, setError] = useState("")

  const parsedTags = rawTags
    .split(/[\n,]+/)
    .map((t) => t.trim())
    .filter(Boolean)

  const handleSubmit = async () => {
    if (parsedTags.length === 0) return
    setIsSubmitting(true)
    setError("")
    setResult(null)

    try {
      const res = await apiClient.importMetrcTags(parsedTags)
      setResult(res)
      if (res.error_count === 0) {
        onImported()
        setTimeout(() => {
          onOpenChange(false)
          setRawTags("")
          setResult(null)
        }, 1500)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't import the tags")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import METRC Tags</DialogTitle>
          <DialogDescription>
            Paste METRC tag numbers, one per line or comma-separated.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tags</Label>
            <Textarea
              value={rawTags}
              onChange={(e) => setRawTags(e.target.value)}
              placeholder={"1A4060300007B9C000000001\n1A4060300007B9C000000002\n1A4060300007B9C000000003"}
              rows={6}
              className="font-mono text-xs"
            />
            <p className="text-muted-foreground text-xs">
              {parsedTags.length} tag{parsedTags.length !== 1 ? "s" : ""} detected
            </p>
          </div>

          {result && (
            <div className={`rounded-md p-2 text-sm ${result.error_count > 0 ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}>
              Imported {result.created_count} tag{result.created_count !== 1 ? "s" : ""}.
              {result.error_count > 0 && ` ${result.error_count} failed.`}
            </div>
          )}

          {error && <ErrorAlert message={error} />}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={parsedTags.length === 0 || isSubmitting}>
            {isSubmitting ? "Importing..." : `Import ${parsedTags.length} Tags`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
