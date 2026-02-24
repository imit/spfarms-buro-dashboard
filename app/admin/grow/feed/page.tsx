"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type FeedEvent } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PhaseBadge } from "@/components/grow/phase-badge"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ArrowLeftIcon, ImageIcon, StickyNoteIcon } from "lucide-react"
import Link from "next/link"

const PAGE_SIZE = 20

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

export default function PlantFeedPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<FeedEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      setIsLoading(true)
      try {
        const res = await apiClient.getPlantFeed({ limit: PAGE_SIZE, offset })
        setEvents(res.data)
        setTotal(res.meta.total)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, offset])

  if (authLoading || !isAuthenticated) return null

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow"><ArrowLeftIcon className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Plant Feed</h1>
          <p className="text-muted-foreground text-sm">Recent observations and notes across all plants</p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <StickyNoteIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No observations yet. Add notes from a plant&apos;s detail page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="py-4">
                {/* Header */}
                <div className="flex items-start gap-2.5">
                  <StrainAvatar name={event.plant.strain_name || "?"} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/grow/plants/${event.plant.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {event.plant.strain_name}
                      </Link>
                      <PhaseBadge phase={event.plant.growth_phase} />
                      {event.plant.room_name && (
                        <span className="text-muted-foreground text-xs">{event.plant.room_name}</span>
                      )}
                    </div>
                    <Link
                      href={`/admin/grow/plants/${event.plant.id}`}
                      className="text-muted-foreground hover:underline font-mono text-xs"
                    >
                      {event.plant.plant_uid}
                    </Link>
                  </div>
                  <span
                    className="text-muted-foreground shrink-0 text-xs"
                    title={new Date(event.created_at).toLocaleString()}
                  >
                    {timeAgo(event.created_at)}
                  </span>
                </div>

                {/* Notes */}
                {event.notes && (
                  <p className="text-sm mt-3">{event.notes}</p>
                )}

                {/* Photos */}
                {event.photo_urls && event.photo_urls.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {event.photo_urls.map((url) => (
                      <button
                        key={url}
                        type="button"
                        className="relative h-20 w-20 overflow-hidden rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setLightboxUrl(url)}
                      >
                        <img src={url} alt="Plant observation" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <p className="text-muted-foreground text-xs mt-3">
                  by {event.user_name}
                </p>
              </CardContent>
            </Card>
          ))}
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

      <Dialog open={!!lightboxUrl} onOpenChange={() => setLightboxUrl(null)}>
        <DialogContent className="max-w-2xl p-2">
          {lightboxUrl && (
            <img src={lightboxUrl} alt="Plant observation" className="w-full rounded" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
