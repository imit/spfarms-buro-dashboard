"use client"

import { useState } from "react"
import { apiClient, type AppSettings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { PencilIcon, CheckIcon, XIcon, EyeIcon, EyeOffIcon, PlusIcon, TrashIcon } from "lucide-react"
import { toast } from "sonner"
import { showError } from "@/lib/errors"

const FACILITY_TYPE_LABELS: Record<string, string> = {
  cultivation: "Cultivation",
  processing: "Processing",
  distribution: "Distribution",
  dispensary: "Dispensary",
}

const FACILITY_TYPE_COLORS: Record<string, string> = {
  cultivation: "bg-green-100 text-green-700",
  processing: "bg-violet-100 text-violet-700",
  distribution: "bg-blue-100 text-blue-700",
  dispensary: "bg-amber-100 text-amber-700",
}

interface MetrcSettingsSectionProps {
  settings: AppSettings | null
  onUpdate: () => Promise<void>
}

function EnvKeyEditor({
  env,
  label,
  color,
  vendorKey,
  userKey,
  onSave,
}: {
  env: string
  label: string
  color: string
  vendorKey: string
  userKey: string
  onSave: (vendor: string, user: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showKeys, setShowKeys] = useState(false)
  const [vendor, setVendor] = useState("")
  const [user, setUser] = useState("")

  function maskKey(key: string) {
    if (!key || key.length < 8) return key ? "****" : ""
    return key.slice(0, 4) + "..." + key.slice(-4)
  }

  function startEdit() {
    setVendor(vendorKey)
    setUser(userKey)
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      await onSave(vendor, user)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`rounded-md border-2 p-3 space-y-2 ${color}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {!editing && (
          <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={startEdit}>
            <PencilIcon className="mr-1 size-3" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">Vendor Key</label>
            <Input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              type={showKeys ? "text" : "password"}
              placeholder="Vendor API key"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground">User Key</label>
            <Input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              type={showKeys ? "text" : "password"}
              placeholder="User API key"
              className="h-7 text-xs font-mono"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-6 text-xs" onClick={handleSave} disabled={saving}>
              <CheckIcon className="mr-1 size-3" /> Save
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditing(false)}>
              <XIcon className="mr-1 size-3" /> Cancel
            </Button>
            <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setShowKeys(!showKeys)}>
              {showKeys ? <EyeOffIcon className="mr-1 size-3" /> : <EyeIcon className="mr-1 size-3" />}
              {showKeys ? "Hide" : "Show"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1 text-xs">
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16">Vendor:</span>
            <code>{vendorKey ? maskKey(vendorKey) : <span className="text-muted-foreground">Not set</span>}</code>
          </div>
          <div className="flex gap-2">
            <span className="text-muted-foreground w-16">User:</span>
            <code>{userKey ? maskKey(userKey) : <span className="text-muted-foreground">Not set</span>}</code>
          </div>
        </div>
      )}
    </div>
  )
}

export function MetrcSettingsSection({ settings, onUpdate }: MetrcSettingsSectionProps) {
  const activeEnv = settings?.metrc_default_env || "sandbox"
  const envFacilities = (settings?.facilities || []).filter((f) => f.environment === activeEnv)

  // Facility license editing
  const [editingFacility, setEditingFacility] = useState<number | null>(null)
  const [licenseValue, setLicenseValue] = useState("")
  const [savingLicense, setSavingLicense] = useState(false)

  // Add facility
  const [showAddFacility, setShowAddFacility] = useState(false)
  const [newFacilityName, setNewFacilityName] = useState("")
  const [newFacilityType, setNewFacilityType] = useState("cultivation")
  const [newFacilityLicense, setNewFacilityLicense] = useState("")
  const [addingFacility, setAddingFacility] = useState(false)

  async function handleSaveLicense(facilityId: number) {
    setSavingLicense(true)
    try {
      await apiClient.updateFacility(facilityId, { metrc_license_number: licenseValue })
      toast.success("License number saved")
      setEditingFacility(null)
      await onUpdate()
    } catch (err) {
      showError("save license number", err)
    } finally {
      setSavingLicense(false)
    }
  }

  async function handleAddFacility() {
    if (!newFacilityName.trim()) return
    setAddingFacility(true)
    try {
      await apiClient.createFacility({
        name: newFacilityName.trim(),
        facility_type: newFacilityType,
        metrc_license_number: newFacilityLicense.trim() || undefined,
        environment: activeEnv,
      })
      toast.success(`Facility "${newFacilityName}" created`)
      setShowAddFacility(false)
      setNewFacilityName("")
      setNewFacilityType("cultivation")
      setNewFacilityLicense("")
      await onUpdate()
    } catch (err) {
      showError("create facility", err)
    } finally {
      setAddingFacility(false)
    }
  }

  async function handleDeleteFacility(id: number, name: string) {
    if (!confirm(`Delete facility "${name}"? This cannot be undone.`)) return
    try {
      await apiClient.deleteFacility(id)
      toast.success(`Facility "${name}" deleted`)
      await onUpdate()
    } catch (err) {
      showError("delete facility", err)
    }
  }

  return (
    <div className="rounded-lg border">
      <div className="p-5 pb-3">
        <h3 className="font-semibold">Metrc Integration</h3>
        <p className="text-sm text-muted-foreground">
          API keys and facility licenses for Metrc compliance tracking
        </p>
      </div>

      <div className="p-5 pt-2 space-y-4">
        {/* API Keys — side by side per environment */}
        <div className="grid gap-3 sm:grid-cols-2">
          <EnvKeyEditor
            env="sandbox"
            label="Sandbox Keys"
            color="border-amber-300 dark:border-amber-800"
            vendorKey={settings?.metrc_sandbox_vendor_key || ""}
            userKey={settings?.metrc_sandbox_user_key || ""}
            onSave={async (vendor, user) => {
              await apiClient.updateSettings({
                metrc_sandbox_vendor_key: vendor,
                metrc_sandbox_user_key: user,
              })
              toast.success("Sandbox keys saved")
              await onUpdate()
            }}
          />
          <EnvKeyEditor
            env="production"
            label="Production Keys"
            color="border-blue-300 dark:border-blue-800"
            vendorKey={settings?.metrc_production_vendor_key || ""}
            userKey={settings?.metrc_production_user_key || ""}
            onSave={async (vendor, user) => {
              await apiClient.updateSettings({
                metrc_production_vendor_key: vendor,
                metrc_production_user_key: user,
              })
              toast.success("Production keys saved")
              await onUpdate()
            }}
          />
        </div>

        {/* Default Environment */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Default Environment:</span>
          <div className="flex h-8 rounded-md border overflow-hidden">
            <button
              type="button"
              onClick={async () => {
                await apiClient.updateSettings({ metrc_default_env: "sandbox" })
                await onUpdate()
              }}
              className={`px-3 text-xs font-medium transition-colors ${
                settings?.metrc_default_env !== "production"
                  ? "bg-amber-500 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Sandbox
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!confirm("Switch default to PRODUCTION?")) return
                await apiClient.updateSettings({ metrc_default_env: "production" })
                await onUpdate()
              }}
              className={`px-3 text-xs font-medium transition-colors ${
                settings?.metrc_default_env === "production"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Production
            </button>
          </div>
        </div>

        {/* Facility Licenses — filtered by current environment */}
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              Facility Licenses
              <Badge variant="outline" className={`ml-2 text-[10px] ${
                activeEnv === "production" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
              }`}>
                {activeEnv === "production" ? "Production" : "Sandbox"}
              </Badge>
            </label>
            <Button size="sm" variant="outline" onClick={() => setShowAddFacility(true)} className="h-7 text-xs">
              <PlusIcon className="mr-1 size-3" /> Add Facility
            </Button>
          </div>

          {envFacilities.length === 0 && !showAddFacility && (
            <p className="text-sm text-muted-foreground">
              No facilities for {activeEnv}. Click Add Facility to create one.
            </p>
          )}

          {envFacilities.map((f) => (
            <div key={f.id} className="flex items-center gap-3 text-sm rounded-md border p-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{f.name}</span>
                  {f.facility_type && (
                    <Badge variant="secondary" className={`text-[10px] ${FACILITY_TYPE_COLORS[f.facility_type] || ""}`}>
                      {FACILITY_TYPE_LABELS[f.facility_type] || f.facility_type}
                    </Badge>
                  )}
                </div>
                {editingFacility === f.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      value={licenseValue}
                      onChange={(e) => setLicenseValue(e.target.value)}
                      placeholder="e.g. OCM-MICR-24-000028-C1"
                      className="h-7 text-xs font-mono w-64"
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleSaveLicense(f.id)} disabled={savingLicense}>
                      <CheckIcon className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingFacility(null)}>
                      <XIcon className="size-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs text-muted-foreground">{f.metrc_license_number || "No license set"}</code>
                    <button
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                      onClick={() => { setEditingFacility(f.id); setLicenseValue(f.metrc_license_number || "") }}
                    >
                      Edit
                    </button>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600 shrink-0"
                onClick={() => handleDeleteFacility(f.id, f.name)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          ))}

          {/* Add facility form */}
          {showAddFacility && (
            <div className="rounded-md border p-3 space-y-2 bg-muted/30">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Name</label>
                  <Input
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    placeholder="e.g. SPFarms Processing"
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground">Type</label>
                  <Select value={newFacilityType} onValueChange={setNewFacilityType}>
                    <SelectTrigger className="h-7 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FACILITY_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground">Metrc License Number</label>
                <Input
                  value={newFacilityLicense}
                  onChange={(e) => setNewFacilityLicense(e.target.value)}
                  placeholder="e.g. OCM-MICR-24-000028-P1"
                  className="h-7 text-xs font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs" onClick={handleAddFacility} disabled={addingFacility || !newFacilityName.trim()}>
                  <CheckIcon className="mr-1 size-3" /> Create
                </Button>
                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowAddFacility(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
