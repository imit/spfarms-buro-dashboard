"use client"

import { useState, useEffect } from "react"
import { apiClient, type Harvest, type MetrcPreflightReport, type MetrcSyncResult, type MetrcTestingSample, type MetrcTestingResult, type AppSettings } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorAlert } from "@/components/ui/error-alert"
import { CloudUploadIcon, SearchIcon, CheckCircle2Icon, AlertTriangleIcon, LoaderIcon, FlaskConicalIcon, Trash2Icon } from "lucide-react"

const SYNC_STATUS_COLORS: Record<string, string> = {
  not_synced: "bg-gray-100 text-gray-600",
  synced_vegetative: "bg-yellow-100 text-yellow-700",
  synced_flowering: "bg-pink-100 text-pink-700",
  synced_harvested: "bg-green-100 text-green-700",
}

interface HarvestMetrcSyncProps {
  harvest: Harvest
  onSyncComplete: () => void
}

export function HarvestMetrcSync({ harvest, onSyncComplete }: HarvestMetrcSyncProps) {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [license, setLicense] = useState("")
  const [metrcEnv, setMetrcEnv] = useState<"sandbox" | "production">("sandbox")
  const [preflight, setPreflight] = useState<MetrcPreflightReport | null>(null)
  const [syncResult, setSyncResult] = useState<MetrcSyncResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [settingsLoaded, setSettingsLoaded] = useState(false)

  // Testing packages
  const [testingSamples, setTestingSamples] = useState<MetrcTestingSample[]>([])
  const [creatingTests, setCreatingTests] = useState(false)
  const [testingResult, setTestingResult] = useState<MetrcTestingResult | null>(null)

  useEffect(() => {
    apiClient.getSettings().then((s) => {
      setSettings(s)
      const env = (s.metrc_default_env || "sandbox") as "sandbox" | "production"
      setMetrcEnv(env)
      // Auto-pick first facility license for current env
      const facility = s.facilities?.find((f) => f.metrc_license_number && f.environment === env)
      if (facility?.metrc_license_number && !license) setLicense(facility.metrc_license_number)
      setSettingsLoaded(true)
    }).catch(() => setSettingsLoaded(true))
  }, [])
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState("")

  async function runPreflight() {
    if (!license) return setError("License number is required")
    setLoading(true)
    setError("")
    setPreflight(null)
    setSyncResult(null)
    try {
      const report = await apiClient.metrcPreflightHarvest(harvest.id, { license, metrc_env: metrcEnv })
      setPreflight(report)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Preflight check failed")
    } finally {
      setLoading(false)
    }
  }

  async function runSync() {
    if (!license) return
    setSyncing(true)
    setError("")
    setSyncResult(null)
    try {
      const result = await apiClient.metrcSyncHarvest(harvest.id, { license, metrc_env: metrcEnv })
      setSyncResult(result)
      if (result.success) {
        onSyncComplete()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-medium flex items-center gap-2">
        <CloudUploadIcon className="size-5" />
        Metrc Sync
      </h2>

      <div className={`rounded-lg border-2 p-4 space-y-4 ${metrcEnv === "production" ? "border-blue-300 dark:border-blue-800" : "border-amber-200 dark:border-amber-900"}`}>
        {/* Config row */}
        <div className="flex items-end gap-3 flex-wrap">
          <div className="space-y-1 flex-1 min-w-[200px]">
            <Label className="text-xs">License Number</Label>
            {settings?.facilities && settings.facilities.some((f) => f.metrc_license_number && f.environment === metrcEnv) ? (
              <Select value={license} onValueChange={setLicense}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Select facility license" />
                </SelectTrigger>
                <SelectContent>
                  {settings.facilities.filter((f) => f.metrc_license_number && f.environment === metrcEnv).map((f) => (
                    <SelectItem key={f.id} value={f.metrc_license_number!}>
                      {f.name} — {f.metrc_license_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={license}
                onChange={(e) => setLicense(e.target.value)}
                placeholder="e.g. SF-SBX-NY-3-18601"
                className="h-8 text-sm"
              />
            )}
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Environment</Label>
            <div className="flex h-8 rounded-md border overflow-hidden">
              <button
                type="button"
                onClick={() => { setMetrcEnv("sandbox"); setLicense(""); setPreflight(null); setSyncResult(null) }}
                className={`px-3 text-xs font-medium transition-colors ${
                  metrcEnv === "sandbox"
                    ? "bg-amber-500 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Sandbox
              </button>
              <button
                type="button"
                onClick={() => { setMetrcEnv("production"); setLicense(""); setPreflight(null); setSyncResult(null) }}
                className={`px-3 text-xs font-medium transition-colors ${
                  metrcEnv === "production"
                    ? "bg-blue-600 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Production
              </button>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={runPreflight} disabled={loading || !license} className="h-8">
            {loading ? <LoaderIcon className="size-3 animate-spin mr-1" /> : <SearchIcon className="size-3 mr-1" />}
            Preflight Check
          </Button>
        </div>

        {/* Metrc sync status badge */}
        {harvest.metrc_id && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2Icon className="size-4 text-green-600" />
            <span className="text-muted-foreground">Synced to Metrc</span>
            <Badge variant="outline" className="text-xs">ID: {harvest.metrc_id}</Badge>
            {harvest.metrc_last_synced_at && (
              <span className="text-xs text-muted-foreground">
                Last sync: {new Date(harvest.metrc_last_synced_at).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Preflight report */}
        {preflight && (
          <div className="space-y-3 rounded-md bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preflight Report</p>

            {/* Plant sync status summary */}
            <div className="flex gap-2 flex-wrap">
              {Object.entries(preflight.by_sync_status).map(([status, count]) => (
                count > 0 && (
                  <Badge key={status} className={`text-xs ${SYNC_STATUS_COLORS[status] || ""}`}>
                    {status.replace("synced_", "").replace("not_", "not ")}: {count}
                  </Badge>
                )
              ))}
            </div>

            {/* Plants without tags warning */}
            {preflight.harvest.plants_without_tags > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertTriangleIcon className="size-4" />
                {preflight.harvest.plants_without_tags} plants have no Metrc tag (will be skipped)
              </div>
            )}

            {/* Strain details */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Strains</p>
              {preflight.strains.map((s) => (
                <div key={s.our_name} className="flex items-center gap-2 text-sm">
                  <span className="font-medium">{s.our_name}</span>
                  {s.name_mismatch && (
                    <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                      Metrc: &quot;{s.metrc_name}&quot;
                    </Badge>
                  )}
                  <span className="text-muted-foreground text-xs">{s.plant_count} plants</span>
                  <div className="flex gap-1 ml-auto">
                    {Object.entries(s.sync_statuses).map(([status, cnt]) => (
                      <Badge key={status} variant="secondary" className="text-[10px]">
                        {status.replace("synced_", "").replace("not_", "")}: {cnt}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions needed */}
            {preflight.actions_needed.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Actions</p>
                <ul className="text-sm space-y-0.5">
                  {preflight.actions_needed.map((action, i) => (
                    <li key={i} className={action.startsWith("WARNING") ? "text-amber-600" : ""}>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Metrc Preview */}
            {preflight.metrc_preview && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Metrc Preview</p>
                <div className="rounded-md border bg-background p-3 space-y-3">
                  {/* Harvest card */}
                  <div className="flex items-start gap-3">
                    <div className="w-1 self-stretch rounded-full bg-green-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{preflight.metrc_preview.harvest.name}</p>
                      <div className="flex gap-4 text-xs text-muted-foreground mt-0.5">
                        <span>{preflight.metrc_preview.harvest.harvest_date}</span>
                        <span>{preflight.metrc_preview.harvest.plant_count} plants</span>
                        <span>{preflight.metrc_preview.harvest.drying_location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Strain breakdown */}
                  <div className="grid gap-2">
                    {preflight.metrc_preview.harvest.strains.map((s) => (
                      <div key={s.name} className="rounded border p-2.5 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{s.name}</span>
                          <Badge variant="outline" className="text-[10px]">{s.plant_count} plants</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[11px] text-muted-foreground mt-1">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wide">Batch</span>
                            <span className="font-mono">{s.batch_name}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wide">Item</span>
                            <span>{s.item_name}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] uppercase tracking-wide">Wet Weight</span>
                            <span>{s.wet_weight_grams}g</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sync button */}
            <Button
              onClick={runSync}
              disabled={syncing || preflight.actions_needed.length === 0}
              className={`w-full ${metrcEnv === "production" ? "bg-blue-600 hover:bg-blue-700" : ""}`}
            >
              {syncing ? (
                <><LoaderIcon className="size-4 animate-spin mr-2" /> Syncing to Metrc...</>
              ) : (
                <><CloudUploadIcon className="size-4 mr-2" /> Sync to Metrc ({metrcEnv === "production" ? "PRODUCTION" : "Sandbox"})</>
              )}
            </Button>
            {metrcEnv === "production" && (
              <p className="text-xs text-blue-600 text-center font-medium">This will write to your live Metrc account</p>
            )}
          </div>
        )}

        {/* Sync result */}
        {syncResult && (
          <div className={`rounded-md p-3 space-y-2 ${syncResult.success ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
            <div className="flex items-center gap-2">
              {syncResult.success ? (
                <CheckCircle2Icon className="size-4 text-green-600" />
              ) : (
                <AlertTriangleIcon className="size-4 text-red-600" />
              )}
              <p className="text-sm font-medium">
                {syncResult.success ? "Sync completed successfully" : "Sync completed with errors"}
              </p>
            </div>

            {syncResult.steps.length > 0 && (
              <div className="space-y-1">
                {syncResult.steps.map((step, i) => (
                  <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                    <CheckCircle2Icon className="size-3 text-green-600 shrink-0" />
                    <span>{step.action}</span>
                  </div>
                ))}
              </div>
            )}

            {syncResult.errors.length > 0 && (
              <div className="space-y-1">
                {syncResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600">{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Testing Packages link */}
        {harvest.metrc_id && (
          <div className="pt-3 border-t">
            <a
              href={`/admin/grow/harvests/${harvest.id}/testing-packages`}
              className="flex items-center justify-between rounded-md border p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FlaskConicalIcon className="size-4" />
                <span className="text-sm font-medium">Create Lab Testing Packages</span>
              </div>
              <span className="text-xs text-muted-foreground">R&D, Potency samples →</span>
            </a>
          </div>
        )}

        {error && <ErrorAlert message={error} />}
      </div>
    </div>
  )
}
