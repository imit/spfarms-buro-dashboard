"use client"

import { useState } from "react"
import { type PlantEventData, type PlantEventType } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import {
  MapPinIcon,
  MoveIcon,
  RefreshCwIcon,
  TagIcon,
  StickyNoteIcon,
  ScissorsIcon,
  TrashIcon,
  ImageIcon,
} from "lucide-react"

const EVENT_ICONS: Record<PlantEventType, React.ReactNode> = {
  placed: <MapPinIcon className="h-3.5 w-3.5" />,
  moved: <MoveIcon className="h-3.5 w-3.5" />,
  phase_changed: <RefreshCwIcon className="h-3.5 w-3.5" />,
  tagged: <TagIcon className="h-3.5 w-3.5" />,
  noted: <StickyNoteIcon className="h-3.5 w-3.5" />,
  harvested: <ScissorsIcon className="h-3.5 w-3.5" />,
  destroyed: <TrashIcon className="h-3.5 w-3.5" />,
}

const EVENT_LABELS: Record<PlantEventType, string> = {
  placed: "Placed",
  moved: "Moved",
  phase_changed: "Phase Changed",
  tagged: "Tagged",
  noted: "Note",
  harvested: "Harvested",
  destroyed: "Destroyed",
}

function formatEventDetail(event: PlantEventData): string {
  const m = event.metadata
  switch (event.event_type) {
    case "moved":
      return `Moved from ${formatLocation(m.from as Record<string, unknown>)} to ${formatLocation(m.to as Record<string, unknown>)}`
    case "phase_changed":
      return `${m.from} → ${m.to}`
    case "tagged":
      return `Tag: ${m.metrc_tag}${m.previous_tag ? ` (was ${m.previous_tag})` : ""}`
    case "destroyed":
      return `Reason: ${m.reason}`
    default:
      return ""
  }
}

function formatLocation(loc: Record<string, unknown> | undefined): string {
  if (!loc) return "?"
  // New rack/tray format
  if (loc.rack_name || loc.tray_name || loc.room_name) {
    const parts: string[] = []
    if (loc.room_name) parts.push(String(loc.room_name))
    if (loc.rack_name) parts.push(String(loc.rack_name))
    if (loc.tray_name) parts.push(String(loc.tray_name))
    return parts.join(" > ")
  }
  // Legacy grid format fallback
  if (typeof loc.col === "number" && typeof loc.row === "number") {
    return `${String.fromCharCode(65 + loc.col)}${loc.row + 1}`
  }
  return "?"
}

function EventPhotos({ urls }: { urls: string[] }) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  if (!urls || urls.length === 0) return null

  return (
    <>
      <div className="mt-1 flex gap-1.5 flex-wrap">
        {urls.map((url) => (
          <button
            key={url}
            type="button"
            className="relative h-16 w-16 overflow-hidden rounded-md border cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setLightboxUrl(url)}
          >
            <img src={url} alt="Plant observation" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Plant observation" className="w-full rounded" />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export function PlantEventTimeline({ events }: { events: PlantEventData[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="text-muted-foreground mt-0.5 shrink-0">
            {event.photo_urls?.length > 0 ? (
              <ImageIcon className="h-3.5 w-3.5 text-green-600" />
            ) : (
              EVENT_ICONS[event.event_type]
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {EVENT_LABELS[event.event_type]}
              </Badge>
              <span className="text-muted-foreground text-[10px]">
                {new Date(event.created_at).toLocaleString()}
              </span>
            </div>
            {formatEventDetail(event) && (
              <p className="text-xs">{formatEventDetail(event)}</p>
            )}
            {event.notes && (
              <p className="text-muted-foreground text-xs italic">{event.notes}</p>
            )}
            <EventPhotos urls={event.photo_urls} />
            <p className="text-muted-foreground text-[10px]">by {event.user_name}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
