import { type PlantEventData, type PlantEventType } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import {
  MapPinIcon,
  MoveIcon,
  RefreshCwIcon,
  TagIcon,
  StickyNoteIcon,
  ScissorsIcon,
  TrashIcon,
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

export function PlantEventTimeline({ events }: { events: PlantEventData[] }) {
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div key={event.id} className="flex gap-3">
          <div className="text-muted-foreground mt-0.5 shrink-0">
            {EVENT_ICONS[event.event_type]}
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
            <p className="text-muted-foreground text-[10px]">by {event.user_name}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
