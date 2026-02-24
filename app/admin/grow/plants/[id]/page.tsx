"use client"

import { useEffect, useState, useRef, use } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Plant, type PlantEventData, GROWTH_PHASE_LABELS, type GrowthPhase } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PhaseBadge } from "@/components/grow/phase-badge"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import { PlantEventTimeline } from "@/components/grow/plant-event-timeline"
import { TagAssignDialog } from "@/components/grow/tag-assign-dialog"
import { PlantMoveDialog } from "@/components/grow/plant-move-dialog"
import {
  ArrowLeftIcon,
  TagIcon,
  MoveIcon,
  RefreshCwIcon,
  CameraIcon,
  XIcon,
  ImageIcon,
  MapPinIcon,
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
import { showError } from "@/lib/errors"

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
  const [showObserveDialog, setShowObserveDialog] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      showError("complete the action", err)
    }
  }

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return
    const newFiles = Array.from(files)
    setPhotoFiles((prev) => [...prev, ...newFiles])
    newFiles.forEach((file) => {
      const url = URL.createObjectURL(file)
      setPhotoPreviews((prev) => [...prev, url])
    })
  }

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const resetObserveDialog = () => {
    setNoteText("")
    photoPreviews.forEach((url) => URL.revokeObjectURL(url))
    setPhotoFiles([])
    setPhotoPreviews([])
  }

  const handleAddObservation = async () => {
    if (!plant || (!noteText.trim() && photoFiles.length === 0)) return
    setIsSubmitting(true)
    try {
      await apiClient.addPlantObservation(plant.id, noteText.trim(), photoFiles)
      toast.success("Observation saved")
      setShowObserveDialog(false)
      resetObserveDialog()
      load()
    } catch (err) {
      showError("complete the action", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!plant) return null

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="mt-1" asChild>
          <Link href={plant.room ? `/admin/grow/rooms/${plant.room.id}` : "/admin/grow"}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <StrainAvatar name={plant.strain?.name || "?"} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-semibold">{plant.strain?.name}</h1>
            <PhaseBadge phase={plant.growth_phase} />
            {plant.status !== "active" && (
              <Badge variant="destructive">{plant.status}</Badge>
            )}
          </div>
          <p className="text-muted-foreground font-mono text-sm">{plant.plant_uid}</p>
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
            <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
            <span>
              {plant.room?.name}
              {plant.rack && <> &middot; F{plant.rack.floor} &middot; {plant.rack.name || `Rack ${(plant.rack.position ?? 0) + 1}`}</>}
              {plant.tray && <> &middot; {plant.tray.name || "Tray"}</>}
            </span>
          </div>
          {plant.metrc_label && (
            <div className="mt-1 flex items-center gap-1 text-sm">
              <TagIcon className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
              <span className="font-mono text-xs">{plant.metrc_label}</span>
            </div>
          )}
        </div>
      </div>

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
          <Button variant="outline" size="sm" onClick={() => setShowObserveDialog(true)}>
            <CameraIcon className="mr-1 h-3.5 w-3.5" /> Add Observation
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>
        <TabsContent value="timeline">
          <Card>
            <CardContent className="py-4">
              {events.length === 0 ? (
                <p className="text-muted-foreground text-sm">No events yet.</p>
              ) : (
                <PlantEventTimeline events={events} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="details">
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
                {plant.strain?.category && (
                  <p className="text-muted-foreground text-xs">{plant.strain.category}</p>
                )}
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
        </TabsContent>
      </Tabs>

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

      {showObserveDialog && (
        <Dialog open={showObserveDialog} onOpenChange={(open) => { setShowObserveDialog(open); if (!open) resetObserveDialog() }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Observation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label>Note</Label>
                <Input
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="e.g. Looking healthy, strong growth"
                />
              </div>
              <div>
                <Label>Photos</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-1 w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="mr-1 h-3.5 w-3.5" /> Choose Photos
                </Button>
                {photoPreviews.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {photoPreviews.map((url, i) => (
                      <div key={url} className="relative">
                        <img src={url} alt="" className="h-16 w-16 rounded-md object-cover border" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-destructive text-white flex items-center justify-center"
                        >
                          <XIcon className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowObserveDialog(false); resetObserveDialog() }}>
                Cancel
              </Button>
              <Button
                onClick={handleAddObservation}
                disabled={isSubmitting || (!noteText.trim() && photoFiles.length === 0)}
              >
                {isSubmitting ? "Saving..." : "Save Observation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
