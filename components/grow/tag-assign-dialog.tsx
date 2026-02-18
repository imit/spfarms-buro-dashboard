"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { apiClient, type MetrcTag } from "@/lib/api"

interface TagAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: number
  plantUid: string
  currentTag: string | null
  onAssigned: () => void
}

export function TagAssignDialog({
  open,
  onOpenChange,
  plantId,
  plantUid,
  currentTag,
  onAssigned,
}: TagAssignDialogProps) {
  const [availableTags, setAvailableTags] = useState<MetrcTag[]>([])
  const [selectedTag, setSelectedTag] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    async function load() {
      const tags = await apiClient.getMetrcTags({ status: "available", tag_type: "plant_tag" })
      setAvailableTags(tags)
      // Auto-suggest first available tag
      if (tags.length > 0) {
        setSelectedTag(tags[0].tag)
      }
    }
    load()
  }, [open])

  const handleSubmit = async () => {
    if (!selectedTag) return
    setIsSubmitting(true)
    setError("")

    try {
      await apiClient.tagPlant(plantId, selectedTag)
      onAssigned()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to assign tag")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign METRC Tag to {plantUid}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {currentTag && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">Current tag:</span>
              <Badge variant="secondary" className="font-mono">{currentTag}</Badge>
              <span className="text-muted-foreground text-xs">(will be released)</span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Available Tags ({availableTags.length})</Label>
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger>
                <SelectValue placeholder="Select a tag..." />
              </SelectTrigger>
              <SelectContent>
                {availableTags.map((t) => (
                  <SelectItem key={t.id} value={t.tag}>
                    <span className="font-mono text-xs">{t.tag}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableTags.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No available tags. Import METRC tags first from the Tags page.
            </p>
          )}

          {error && <p className="bg-destructive/10 text-destructive rounded-md p-2 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!selectedTag || isSubmitting}>
            {isSubmitting ? "Assigning..." : "Assign Tag"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
