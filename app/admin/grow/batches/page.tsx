"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type PlantBatch, BATCH_TYPE_LABELS } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { BatchCreateDialog } from "@/components/grow/batch-create-dialog"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import { ArrowLeftIcon, PlusIcon, LayersIcon } from "lucide-react"
import Link from "next/link"

export default function BatchesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [batches, setBatches] = useState<PlantBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    apiClient
      .getPlantBatches()
      .then(setBatches)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [isAuthenticated])

  if (authLoading || !isAuthenticated) return null

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Plant Batches</h1>
          <p className="text-muted-foreground text-sm">Manage seed, clone, and mother batches</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowCreate(true)}>
          <PlusIcon className="mr-1 h-3.5 w-3.5" /> New Batch
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : batches.length === 0 ? (
        <div className="rounded-lg border border-dashed py-6 text-center">
          <LayersIcon className="text-muted-foreground mx-auto mb-1.5 h-6 w-6" />
          <p className="text-muted-foreground text-xs">No batches yet</p>
        </div>
      ) : (
        <div className="rounded-lg border divide-y">
          {batches.map((batch) => {
            const pct = batch.initial_count > 0
              ? Math.round((batch.active_plant_count / batch.initial_count) * 100)
              : 0
            const typeColor = batch.batch_type === "seed"
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              : batch.batch_type === "clone"
                ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                : "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
            return (
              <div key={batch.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                <div className="relative shrink-0 h-[30px] w-[28px]">
                  <div className="absolute top-0 left-1 opacity-40 scale-90">
                    <StrainAvatar name={batch.strain?.name || "?"} size={24} />
                  </div>
                  <div className="absolute top-[6px] left-0">
                    <StrainAvatar name={batch.strain?.name || "?"} size={24} />
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{batch.name}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none ${typeColor}`}>
                      {BATCH_TYPE_LABELS[batch.batch_type]}
                    </span>
                  </div>
                  <span className="text-muted-foreground text-xs">{batch.strain?.name}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm tabular-nums font-medium">{batch.active_plant_count}<span className="text-muted-foreground font-normal">/{batch.initial_count}</span></span>
                  </div>
                  <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500/70 transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <BatchCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={async () => {
          const b = await apiClient.getPlantBatches().catch(() => [])
          setBatches(b)
        }}
      />
    </div>
  )
}
