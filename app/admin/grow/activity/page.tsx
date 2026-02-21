"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type AuditEventData } from "@/lib/api"
import { AuditEventTimeline } from "@/components/audit-event-timeline"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 50

export default function GrowActivityPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<AuditEventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      setIsLoading(true)
      try {
        const opts: { limit: number; offset: number; trackable_type?: string } = {
          limit: PAGE_SIZE,
          offset,
        }
        if (filter !== "all") opts.trackable_type = filter
        const res = await apiClient.getAuditEvents(opts)
        setEvents(res.data)
        setTotal(res.meta.total)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, filter, offset])

  if (authLoading || !isAuthenticated) return null

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow"><ArrowLeftIcon className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Activity Log</h1>
          <p className="text-muted-foreground text-sm">Recent events across your grow operation</p>
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setOffset(0) }}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="Harvest">Harvests</SelectItem>
            <SelectItem value="PlantBatch">Batches</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events recorded yet.</p>
      ) : (
        <div className="rounded-lg border p-4">
          <AuditEventTimeline events={events} showTrackable />
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex justify-between items-center">
          <Button
            size="sm"
            variant="outline"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={offset + PAGE_SIZE >= total}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
