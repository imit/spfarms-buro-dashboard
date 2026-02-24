"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type Plant } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PhaseBadge } from "@/components/grow/phase-badge"
import {
  ArrowLeftIcon,
  SearchIcon,
  ImageIcon,
  XIcon,
  SendIcon,
  TagIcon,
  MapPinIcon,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { showError } from "@/lib/errors"

export default function ObservePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [query, setQuery] = useState("")
  const [plant, setPlant] = useState<Plant | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const [notes, setNotes] = useState("")
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  const handleLookup = async () => {
    const q = query.trim()
    if (!q) return
    setIsSearching(true)
    setLookupError(null)
    setPlant(null)
    try {
      const p = await apiClient.lookupPlant(q)
      setPlant(p)
    } catch {
      setLookupError(`No plant found for "${q}"`)
    } finally {
      setIsSearching(false)
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

  const handleSubmit = async () => {
    if (!plant || (!notes.trim() && photoFiles.length === 0)) return
    setIsSubmitting(true)
    try {
      await apiClient.addPlantObservation(plant.id, notes.trim(), photoFiles)
      toast.success("Observation saved")
      setNotes("")
      photoPreviews.forEach((url) => URL.revokeObjectURL(url))
      setPhotoFiles([])
      setPhotoPreviews([])
      // Reset for next scan
      setPlant(null)
      setQuery("")
    } catch (err) {
      showError("save the observation", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (authLoading || !isAuthenticated) return null

  return (
    <div className="mx-auto max-w-xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/grow">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">Quick Observe</h1>
      </div>

      {/* Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Find Plant</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Plant UID (SPF-PLT-...) or METRC tag"
              className="font-mono"
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            />
            <Button onClick={handleLookup} disabled={isSearching || !query.trim()}>
              <SearchIcon className="h-4 w-4" />
            </Button>
          </div>
          {lookupError && (
            <p className="text-destructive text-sm mt-2">{lookupError}</p>
          )}
        </CardContent>
      </Card>

      {/* Plant Info */}
      {plant && (
        <>
          <Card>
            <CardContent className="py-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">{plant.strain?.name}</h2>
                  <p className="text-muted-foreground font-mono text-xs">{plant.plant_uid}</p>
                </div>
                <PhaseBadge phase={plant.growth_phase} />
              </div>
              {plant.room && (
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <MapPinIcon className="h-3 w-3" />
                  {plant.room.name}
                  {plant.rack && <> &middot; Floor {plant.rack.floor} &middot; {plant.rack.name}</>}
                  {plant.tray && <> &middot; {plant.tray.name}</>}
                </div>
              )}
              {plant.metrc_label && (
                <Badge variant="secondary" className="font-mono text-xs">
                  <TagIcon className="mr-1 h-3 w-3" />
                  {plant.metrc_label}
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Observation Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Observation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Note</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="How's this plant looking?"
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
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={isSubmitting || (!notes.trim() && photoFiles.length === 0)}
              >
                {isSubmitting ? "Saving..." : (
                  <>
                    <SendIcon className="mr-1 h-3.5 w-3.5" /> Save Observation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
