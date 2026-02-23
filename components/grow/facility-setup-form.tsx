"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ErrorAlert } from "@/components/ui/error-alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { apiClient, type Facility } from "@/lib/api"

interface FacilitySetupFormProps {
  facility: Facility | null
  onSaved: (facility: Facility) => void
}

export function FacilitySetupForm({ facility, onSaved }: FacilitySetupFormProps) {
  const [name, setName] = useState(facility?.name || "")
  const [description, setDescription] = useState(facility?.description || "")
  const [licenseNumber, setLicenseNumber] = useState(facility?.license_number || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")

    try {
      const saved = await apiClient.updateFacility({
        name,
        description: description || undefined,
        license_number: licenseNumber || undefined,
      })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't save the facility")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Facility Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="SPFarms NY"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>License Number</Label>
          <Input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            placeholder="METRC license number"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Facility notes..."
          rows={2}
        />
      </div>

      {error && <ErrorAlert message={error} />}

      <Button type="submit" disabled={!name || isSubmitting}>
        {isSubmitting ? "Saving..." : facility ? "Update Facility" : "Create Facility"}
      </Button>
    </form>
  )
}
