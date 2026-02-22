"use client"

import { useEffect, useState } from "react"
import { apiClient, type Plant, type PlantEventData } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { PhaseBadge } from "@/components/grow/phase-badge"
import { PlantEventTimeline } from "@/components/grow/plant-event-timeline"
import { TagIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function PlantDetailDialog({
  open,
  onOpenChange,
  plantId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plantId: number
}) {
  const [plant, setPlant] = useState<Plant | null>(null)
  const [events, setEvents] = useState<PlantEventData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!open) return
    setIsLoading(true)
    Promise.all([
      apiClient.getPlant(plantId),
      apiClient.getPlantEvents(plantId),
    ])
      .then(([p, ev]) => {
        setPlant(p)
        setEvents(ev)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [open, plantId])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : plant ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {plant.strain?.name}
                <PhaseBadge phase={plant.growth_phase} />
                {plant.status !== "active" && (
                  <Badge variant="destructive">{plant.status}</Badge>
                )}
              </DialogTitle>
              <p className="text-muted-foreground font-mono text-sm">{plant.plant_uid}</p>
            </DialogHeader>

            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Location</p>
                <p className="font-medium">
                  {plant.room?.name}
                  {plant.rack && <> &middot; F{plant.rack.floor} &middot; {plant.rack.name || `Rack ${plant.rack.position + 1}`}</>}
                  {plant.tray && <> &middot; {plant.tray.name || "Tray"}</>}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Strain</p>
                <p className="font-medium">{plant.strain?.name}</p>
                {plant.strain?.category && (
                  <p className="text-muted-foreground text-xs">{plant.strain.category}</p>
                )}
              </div>
              {plant.plant_batch && (
                <div>
                  <p className="text-muted-foreground text-xs">Batch</p>
                  <p className="font-medium">{plant.plant_batch.name}</p>
                  <p className="text-muted-foreground font-mono text-[10px]">{plant.plant_batch.batch_uid}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-xs">METRC Tag</p>
                {plant.metrc_label ? (
                  <Badge variant="secondary" className="font-mono text-xs">
                    <TagIcon className="mr-1 h-3 w-3" />
                    {plant.metrc_label}
                  </Badge>
                ) : (
                  <p className="text-muted-foreground">Not tagged</p>
                )}
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Placed</p>
                <p>{new Date(plant.created_at).toLocaleDateString()}</p>
                {plant.placed_by && (
                  <p className="text-muted-foreground text-xs">by {plant.placed_by.full_name || plant.placed_by.email}</p>
                )}
              </div>
            </div>

            {events.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Event Timeline</p>
                <PlantEventTimeline events={events} />
              </div>
            )}
          </>
        ) : (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">Plant not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
