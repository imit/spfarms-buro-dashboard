"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Harvest, HARVEST_STATUS_LABELS, type HarvestStatus } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import { ArrowLeftIcon, ScissorsIcon } from "lucide-react"
import Link from "next/link"

const STATUS_COLORS: Record<HarvestStatus, string> = {
  active: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  drying: "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
  dried: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
  packaged: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400",
}

export default function HarvestsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [harvests, setHarvests] = useState<Harvest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const h = await apiClient.getHarvests()
        setHarvests(h)
      } catch {
        // ignore
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated])

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/grow"><ArrowLeftIcon className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Harvests</h1>
            <p className="text-muted-foreground text-sm">Track harvests from cut to package</p>
          </div>
        </div>
        <Button asChild>
          <Link href="/admin/grow/harvests/new">
            <ScissorsIcon className="mr-2 h-4 w-4" /> New Harvest
          </Link>
        </Button>
      </div>

      {harvests.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <ScissorsIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No harvests yet</p>
          <p className="text-muted-foreground text-xs mt-1">Harvest flowering plants to get started.</p>
          <Button className="mt-4" size="sm" asChild>
            <Link href="/admin/grow/harvests/new">
              <ScissorsIcon className="mr-1 h-3.5 w-3.5" /> Start First Harvest
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {harvests.map((harvest) => (
            <Link key={harvest.id} href={`/admin/grow/harvests/${harvest.id}`} className="block">
              <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <StrainAvatar name={harvest.strain?.name || "?"} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{harvest.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${STATUS_COLORS[harvest.status]}`}>
                      {HARVEST_STATUS_LABELS[harvest.status]}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs mt-0.5">
                    {harvest.strain?.name} &middot; {harvest.plant_count} plant{harvest.plant_count !== 1 ? "s" : ""}
                    {harvest.wet_weight_grams != null && <> &middot; {harvest.wet_weight_grams}g wet</>}
                    {harvest.dry_weight_grams != null && <> &rarr; {harvest.dry_weight_grams}g dry</>}
                    {harvest.drying_days != null && harvest.status === "drying" && <> &middot; Day {harvest.drying_days}</>}
                  </div>
                </div>
                <span className="text-muted-foreground text-xs shrink-0">{harvest.harvest_date}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
