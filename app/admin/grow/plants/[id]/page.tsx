"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Plant, type PlantEventData, GROWTH_PHASE_LABELS, type GrowthPhase } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PhaseBadge } from "@/components/grow/phase-badge"
import { PlantEventTimeline } from "@/components/grow/plant-event-timeline"
import { TagAssignDialog } from "@/components/grow/tag-assign-dialog"
import { PlantMoveDialog } from "@/components/grow/plant-move-dialog"
import {
  ArrowLeftIcon,
  TagIcon,
  MoveIcon,
  RefreshCwIcon,
  StickyNoteIcon,
} from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function PlantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [plant, setPlant] = useState<Plant | null>(null)
  const [events, setEvents] = useState<PlantEventData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Dialogs
  const [showTagDialog, setShowTagDialog] = useState(false)
  const [showMoveDialog, setShowMoveDialog] = useState(false)
  const [showPhaseDialog, setShowPhaseDialog] = useState(false)
  const [showNoteDialog, setShowNoteDialog] = useState(false)
  const [noteText, setNoteText] = useState("")

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  const load = async () => {
    try {
      const [p, ev] = await Promise.all([
        apiClient.getPlant(Number(id)),
        apiClient.getPlantEvents(Number(id)),
      ])
      setPlant(p)
      setEvents(ev)
    } catch {
      router.push("/admin/grow")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, id])

  const handleChangePhase = async (newPhase: string) => {
    if (!plant) return
    try {
      await apiClient.changePlantPhase(plant.id, newPhase)
      toast.success("Phase changed")
      setShowPhaseDialog(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  const handleAddNote = async () => {
    if (!plant || !noteText.trim()) return
    try {
      await apiClient.addPlantNote(plant.id, noteText.trim())
      toast.success("Note added")
      setShowNoteDialog(false)
      setNoteText("")
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed")
    }
  }

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!plant) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={plant.room ? `/admin/grow/rooms/${plant.room.id}` : "/admin/grow"}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">{plant.strain?.name}</h1>
            <PhaseBadge phase={plant.growth_phase} />
            {plant.status !== "active" && (
              <Badge variant="destructive">{plant.status}</Badge>
            )}
          </div>
          <p className="text-muted-foreground font-mono text-sm">{plant.plant_uid}</p>
        </div>
      </div>

      {/* Info Card */}
      <Card>
        <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
          <div>
            <p className="text-muted-foreground text-xs">Location</p>
            <p className="text-sm font-medium">
              {plant.room?.name} &middot; Floor {plant.rack?.floor} &middot; {plant.rack?.name || `Rack ${(plant.rack?.position ?? 0) + 1}`} &middot; {plant.tray?.name || "Tray"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Strain</p>
            <p className="text-sm font-medium">{plant.strain?.name}</p>
          </div>
          {plant.plant_batch && (
            <div>
              <p className="text-muted-foreground text-xs">Batch</p>
              <p className="text-sm font-medium">{plant.plant_batch.name}</p>
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
              <p className="text-muted-foreground text-sm">Not tagged</p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Placed</p>
            <p className="text-sm">{new Date(plant.created_at).toLocaleDateString()}</p>
            {plant.placed_by && (
              <p className="text-muted-foreground text-xs">by {plant.placed_by.full_name || plant.placed_by.email}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      {plant.status === "active" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMoveDialog(true)}>
            <MoveIcon className="mr-1 h-3.5 w-3.5" /> Move
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowPhaseDialog(true)}>
            <RefreshCwIcon className="mr-1 h-3.5 w-3.5" /> Change Phase
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowTagDialog(true)}>
            <TagIcon className="mr-1 h-3.5 w-3.5" /> {plant.metrc_label ? "Reassign" : "Assign"} Tag
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowNoteDialog(true)}>
            <StickyNoteIcon className="mr-1 h-3.5 w-3.5" /> Add Note
          </Button>
        </div>
      )}

      {/* Event Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events yet.</p>
          ) : (
            <PlantEventTimeline events={events} />
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {showTagDialog && (
        <TagAssignDialog
          open={showTagDialog}
          onOpenChange={setShowTagDialog}
          plantId={plant.id}
          plantUid={plant.plant_uid}
          currentTag={plant.metrc_label}
          onAssigned={load}
        />
      )}

      {showMoveDialog && (
        <PlantMoveDialog
          open={showMoveDialog}
          onOpenChange={setShowMoveDialog}
          plantId={plant.id}
          plantUid={plant.plant_uid}
          currentRoomId={plant.room?.id ?? 0}
          currentFloor={plant.rack?.floor ?? 1}
          onMoved={load}
        />
      )}

      {showPhaseDialog && (
        <Dialog open={showPhaseDialog} onOpenChange={setShowPhaseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Phase</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <p className="text-muted-foreground text-sm">
                Current: <PhaseBadge phase={plant.growth_phase} />
              </p>
              <Select onValueChange={handleChangePhase}>
                <SelectTrigger><SelectValue placeholder="Select new phase..." /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(GROWTH_PHASE_LABELS) as [GrowthPhase, string][])
                    .filter(([key]) => key !== plant.growth_phase)
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {showNoteDialog && (
        <Dialog open={showNoteDialog} onOpenChange={(open) => { setShowNoteDialog(open); if (!open) setNoteText("") }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <div className="py-2">
              <Label>Note</Label>
              <Input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="e.g. Looking healthy, strong growth"
                onKeyDown={(e) => e.key === "Enter" && handleAddNote()}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowNoteDialog(false); setNoteText("") }}>
                Cancel
              </Button>
              <Button onClick={handleAddNote} disabled={!noteText.trim()}>
                Add Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
