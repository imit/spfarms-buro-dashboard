"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Harvest } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import { ArrowLeftIcon, Flower as FlowerIcon, ScaleIcon } from "lucide-react"
import Link from "next/link"

function gToLbs(grams: number): string {
  return (grams / 453.592).toFixed(2)
}

interface StrainTotals {
  strain_id: number
  strain_name: string
  flower_grams: number
  shake_grams: number
  harvests: { id: number; name: string; flower_grams: number; shake_grams: number }[]
}

export default function FlowerPage() {
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

  // Aggregate per-strain flower/shake across all harvests
  const strainMap = new Map<number, StrainTotals>()

  for (const harvest of harvests) {
    for (const hw of harvest.harvest_weights || []) {
      const flower = Number(hw.flower_weight_grams) || 0
      const shake = Number(hw.shake_weight_grams) || 0
      if (flower === 0 && shake === 0) continue

      let entry = strainMap.get(hw.strain_id)
      if (!entry) {
        entry = { strain_id: hw.strain_id, strain_name: hw.strain_name, flower_grams: 0, shake_grams: 0, harvests: [] }
        strainMap.set(hw.strain_id, entry)
      }
      entry.flower_grams += flower
      entry.shake_grams += shake
      entry.harvests.push({ id: harvest.id, name: harvest.name, flower_grams: flower, shake_grams: shake })
    }
  }

  const strains = Array.from(strainMap.values()).sort((a, b) => b.flower_grams - a.flower_grams)
  const grandFlower = strains.reduce((sum, s) => sum + s.flower_grams, 0)
  const grandShake = strains.reduce((sum, s) => sum + s.shake_grams, 0)

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow"><ArrowLeftIcon className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Flower Inventory</h1>
          <p className="text-muted-foreground text-sm">Trimmed flower and shake totals by strain across all harvests</p>
        </div>
      </div>

      {/* Grand Totals */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <FlowerIcon className="h-4 w-4 text-violet-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Flower</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{grandFlower.toFixed(1)}g</p>
          <p className="text-sm text-muted-foreground mt-0.5">{gToLbs(grandFlower)} lbs</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-1">
            <ScaleIcon className="h-4 w-4 text-teal-500" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Shake</span>
          </div>
          <p className="text-3xl font-semibold tabular-nums">{grandShake.toFixed(1)}g</p>
          <p className="text-sm text-muted-foreground mt-0.5">{gToLbs(grandShake)} lbs</p>
        </div>
      </div>

      {/* Per-Strain Breakdown */}
      {strains.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center">
          <FlowerIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
          <p className="text-muted-foreground text-sm">No trimmed flower yet</p>
          <p className="text-muted-foreground text-xs mt-1">Flower and shake weights are recorded during the trimming phase of a harvest.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-medium">By Strain</h2>
          <div className="rounded-lg border divide-y">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
              <span>Strain</span>
              <span className="text-right">Flower</span>
              <span className="text-right">Shake</span>
            </div>
            {strains.map((strain) => (
              <div key={strain.strain_id}>
                {/* Strain total row */}
                <div className="grid grid-cols-[1fr_100px_100px] gap-2 px-4 py-3 items-center">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StrainAvatar name={strain.strain_name} size={28} />
                    <div className="min-w-0">
                      <span className="text-sm font-semibold truncate block">{strain.strain_name}</span>
                      <span className="text-muted-foreground text-[10px]">{strain.harvests.length} harvest{strain.harvests.length !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold tabular-nums">{strain.flower_grams.toFixed(1)}g</span>
                    <span className="text-[10px] text-muted-foreground block">{gToLbs(strain.flower_grams)} lbs</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold tabular-nums">{strain.shake_grams.toFixed(1)}g</span>
                    <span className="text-[10px] text-muted-foreground block">{gToLbs(strain.shake_grams)} lbs</span>
                  </div>
                </div>
                {/* Per-harvest breakdown */}
                {strain.harvests.length > 1 && (
                  <div className="bg-muted/30 px-4 py-1.5 space-y-1">
                    {strain.harvests.map((h) => (
                      <div key={h.id} className="grid grid-cols-[1fr_100px_100px] gap-2 text-xs text-muted-foreground">
                        <Link href={`/admin/grow/harvests/${h.id}`} className="truncate hover:underline pl-9">
                          {h.name}
                        </Link>
                        <span className="text-right tabular-nums">{h.flower_grams.toFixed(1)}g</span>
                        <span className="text-right tabular-nums">{h.shake_grams.toFixed(1)}g</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
