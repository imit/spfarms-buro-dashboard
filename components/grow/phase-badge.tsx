import { Badge } from "@/components/ui/badge"
import { type GrowthPhase, GROWTH_PHASE_LABELS } from "@/lib/api"

const PHASE_COLORS: Record<GrowthPhase, string> = {
  immature: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  vegetative: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  flowering: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
}

export function PhaseBadge({ phase }: { phase: GrowthPhase }) {
  return (
    <Badge variant="outline" className={PHASE_COLORS[phase]}>
      {GROWTH_PHASE_LABELS[phase]}
    </Badge>
  )
}
