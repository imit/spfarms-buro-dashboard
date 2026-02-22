import { type AuditEventData, type AuditEventType, AUDIT_EVENT_LABELS } from "@/lib/api"
import {
  ScissorsIcon,
  PlusIcon,
  DropletIcon,
  WindIcon,
  ScaleIcon,
  CheckCircleIcon,
  RefreshCwIcon,
  EditIcon,
  LayersIcon,
  StickyNoteIcon,
  PackageIcon,
  ShieldCheckIcon,
} from "lucide-react"
import Link from "next/link"

const EVENT_CONFIG: Record<AuditEventType, { icon: React.ReactNode; color: string; bg: string }> = {
  harvest_created:               { icon: <ScissorsIcon className="h-4 w-4" />,     color: "text-orange-500",  bg: "bg-orange-100 dark:bg-orange-900/30" },
  harvest_plants_added:          { icon: <PlusIcon className="h-4 w-4" />,          color: "text-blue-500",    bg: "bg-blue-100 dark:bg-blue-900/30" },
  harvest_wet_weight_recorded:   { icon: <DropletIcon className="h-4 w-4" />,       color: "text-cyan-500",    bg: "bg-cyan-100 dark:bg-cyan-900/30" },
  harvest_drying_started:        { icon: <WindIcon className="h-4 w-4" />,          color: "text-amber-500",   bg: "bg-amber-100 dark:bg-amber-900/30" },
  harvest_dry_weight_recorded:   { icon: <ScaleIcon className="h-4 w-4" />,         color: "text-green-500",   bg: "bg-green-100 dark:bg-green-900/30" },
  harvest_drying_finished:       { icon: <CheckCircleIcon className="h-4 w-4" />,   color: "text-green-600",   bg: "bg-green-100 dark:bg-green-900/30" },
  harvest_status_changed:        { icon: <RefreshCwIcon className="h-4 w-4" />,     color: "text-purple-500",  bg: "bg-purple-100 dark:bg-purple-900/30" },
  harvest_strain_weight_recorded:{ icon: <ScaleIcon className="h-4 w-4" />,         color: "text-teal-500",    bg: "bg-teal-100 dark:bg-teal-900/30" },
  harvest_waste_recorded:        { icon: <ScaleIcon className="h-4 w-4" />,         color: "text-red-500",     bg: "bg-red-100 dark:bg-red-900/30" },
  harvest_updated:               { icon: <EditIcon className="h-4 w-4" />,          color: "text-gray-500",    bg: "bg-gray-100 dark:bg-gray-800/30" },
  harvest_trimming_started:      { icon: <ScissorsIcon className="h-4 w-4" />,     color: "text-violet-500",  bg: "bg-violet-100 dark:bg-violet-900/30" },
  harvest_trimming_finished:     { icon: <CheckCircleIcon className="h-4 w-4" />,  color: "text-violet-600",  bg: "bg-violet-100 dark:bg-violet-900/30" },
  harvest_curing_finished:       { icon: <PackageIcon className="h-4 w-4" />,      color: "text-pink-500",    bg: "bg-pink-100 dark:bg-pink-900/30" },
  harvest_admin_reviewed:        { icon: <ShieldCheckIcon className="h-4 w-4" />, color: "text-indigo-500",  bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  batch_created:                 { icon: <LayersIcon className="h-4 w-4" />,        color: "text-emerald-500", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  note_added:                    { icon: <StickyNoteIcon className="h-4 w-4" />,    color: "text-yellow-500",  bg: "bg-yellow-100 dark:bg-yellow-900/30" },
}

function trackableHref(event: AuditEventData): string | null {
  switch (event.trackable_type) {
    case "Harvest":
      return `/admin/grow/harvests/${event.trackable_id}`
    default:
      return null
  }
}

function w(grams: unknown): string {
  const g = Number(grams)
  const lbs = (g / 453.592).toFixed(2)
  return `${g}g (${lbs}lb)`
}

function formatEventDetail(event: AuditEventData): string {
  const m = event.metadata
  switch (event.event_type) {
    case "harvest_created":
      return `${m.plant_count} plants, ${m.harvest_type} harvest${m.strain_name ? ` — ${m.strain_name}` : ""}`
    case "harvest_plants_added":
      return `${m.plant_count} plant${(m.plant_count as number) !== 1 ? "s" : ""} added (total: ${m.new_total})`
    case "harvest_wet_weight_recorded":
      return w(m.wet_weight_grams)
    case "harvest_drying_started":
      return m.drying_room_name ? `Room: ${m.drying_room_name}, ${w(m.wet_weight_grams)} wet` : `${w(m.wet_weight_grams)} wet`
    case "harvest_dry_weight_recorded":
      return w(m.dry_weight_grams)
    case "harvest_drying_finished": {
      const parts: string[] = []
      if (m.dry_weight_grams) parts.push(`${w(m.dry_weight_grams)} dry`)
      if (m.drying_days) parts.push(`${m.drying_days} days`)
      return parts.join(", ")
    }
    case "harvest_status_changed":
      return `${m.from} → ${m.to}`
    case "harvest_strain_weight_recorded": {
      const parts: string[] = []
      if (m.strain_name) parts.push(String(m.strain_name))
      if (m.wet_weight_grams) parts.push(`${w(m.wet_weight_grams)} wet`)
      if (m.dry_weight_grams) parts.push(`${w(m.dry_weight_grams)} dry`)
      if (m.flower_weight_grams) parts.push(`${w(m.flower_weight_grams)} flower`)
      if (m.shake_weight_grams) parts.push(`${w(m.shake_weight_grams)} shake`)
      return parts.join(" — ")
    }
    case "harvest_waste_recorded":
      return w(m.waste_weight_grams)
    case "harvest_trimming_started":
      return m.dry_weight_grams ? `${w(m.dry_weight_grams)} dry weight` : ""
    case "harvest_trimming_finished": {
      const parts: string[] = []
      if (m.flower_weight_grams) parts.push(`${w(m.flower_weight_grams)} flower`)
      if (m.shake_weight_grams) parts.push(`${w(m.shake_weight_grams)} shake`)
      if (m.waste_weight_grams) parts.push(`${w(m.waste_weight_grams)} waste`)
      if (m.trimming_days) parts.push(`${m.trimming_days} days`)
      return parts.join(", ")
    }
    case "harvest_curing_finished":
      return m.curing_days ? `${m.curing_days} days` : ""
    case "harvest_admin_reviewed":
      return m.reviewed_by ? `Reviewed by ${m.reviewed_by}` : ""
    case "batch_created":
      return `${m.batch_type} batch, ${m.initial_count} ${m.strain_name}`
    default:
      return ""
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffSec = Math.floor((now - then) / 1000)
  if (diffSec < 60) return "just now"
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function AuditEventTimeline({ events, showTrackable = false }: {
  events: AuditEventData[]
  showTrackable?: boolean
}) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[17px] top-2 bottom-2 w-px bg-border" />

      <div className="space-y-0">
        {events.map((event) => {
          const cfg = EVENT_CONFIG[event.event_type]
          const href = showTrackable ? trackableHref(event) : null
          const detail = formatEventDetail(event)
          return (
            <div key={event.id} className="relative flex gap-3.5 py-2.5 pl-0">
              {/* Icon dot */}
              <div className={`relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full ${cfg.bg}`}>
                <span className={cfg.color}>{cfg.icon}</span>
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${cfg.color}`}>
                    {AUDIT_EVENT_LABELS[event.event_type]}
                  </span>
                  {showTrackable && href ? (
                    <Link href={href} className="text-sm font-medium hover:underline">
                      {event.trackable_name}
                    </Link>
                  ) : showTrackable ? (
                    <span className="text-sm font-medium">{event.trackable_name}</span>
                  ) : null}
                  <span className="text-xs text-muted-foreground" title={new Date(event.created_at).toLocaleString()}>
                    {timeAgo(event.created_at)}
                  </span>
                </div>
                {detail && (
                  <p className="text-sm text-muted-foreground mt-0.5">{detail}</p>
                )}
                {event.notes && (
                  <p className="text-sm text-muted-foreground italic mt-0.5">{event.notes}</p>
                )}
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  {event.user.full_name || event.user.email}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
