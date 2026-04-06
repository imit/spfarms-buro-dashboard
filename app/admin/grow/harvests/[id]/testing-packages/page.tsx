"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  apiClient,
  type Harvest,
  type AppSettings,
  type MetrcTestingSample,
  type MetrcTestingResult,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ErrorAlert } from "@/components/ui/error-alert"
import { StrainAvatar } from "@/components/grow/strain-avatar"
import {
  ArrowLeftIcon,
  FlaskConicalIcon,
  LoaderIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Trash2Icon,
  PlusIcon,
} from "lucide-react"
import Link from "next/link"

export default function TestingPackagesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)

  const [harvest, setHarvest] = useState<Harvest | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const [metrcEnv, setMetrcEnv] = useState<"sandbox" | "production">("sandbox")
  const [license, setLicense] = useState("")
  const [samples, setSamples] = useState<MetrcTestingSample[]>([])
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState<MetrcTestingResult | null>(null)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  useEffect(() => {
    if (!isAuthenticated) return
    async function load() {
      try {
        const [h, s] = await Promise.all([
          apiClient.getHarvest(id),
          apiClient.getSettings(),
        ])
        setHarvest(h)
        setSettings(s)
        const env = (s.metrc_default_env || "sandbox") as "sandbox" | "production"
        setMetrcEnv(env)
        const facility = s.facilities?.find((f) => f.metrc_license_number && f.environment === env)
        if (facility?.metrc_license_number) setLicense(facility.metrc_license_number)
      } catch {
        setError("Failed to load harvest")
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, id])

  function addAllRnD() {
    if (!harvest) return
    const strains = [...new Set(harvest.harvest_plants.map((hp) => hp.strain_name))]
    setSamples(strains.map((s) => ({
      strain: s,
      grams: 15,
      batch_id: `${s.replace(/\s+/g, "").slice(0, 4).toUpperCase()}-R01`,
      test_type: "rnd",
    })))
  }

  function addAllPotency() {
    if (!harvest) return
    const strains = [...new Set(harvest.harvest_plants.map((hp) => hp.strain_name))]
    setSamples(strains.map((s) => ({
      strain: s,
      grams: 10,
      batch_id: `${s.replace(/\s+/g, "").slice(0, 4).toUpperCase()}-POTR01`,
      test_type: "potency",
    })))
  }

  async function handleCreate() {
    if (!license || samples.length === 0) return
    setCreating(true)
    setError("")
    setResult(null)
    try {
      const res = await apiClient.metrcCreateTestingPackages(id, {
        license,
        metrc_env: metrcEnv,
        samples,
      })
      setResult(res)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create testing packages")
    } finally {
      setCreating(false)
    }
  }

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>
  if (!harvest) return <div className="p-6"><ErrorAlert message="Harvest not found" /></div>

  const envFacilities = (settings?.facilities || []).filter(
    (f) => f.metrc_license_number && f.environment === metrcEnv
  )

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/grow/harvests/${id}`}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FlaskConicalIcon className="size-6" />
            Lab Testing Packages
          </h1>
          <p className="text-sm text-muted-foreground">
            {harvest.name} — {harvest.harvest_plants.length} plants,{" "}
            {[...new Set(harvest.harvest_plants.map((hp) => hp.strain_name))].length} strains
          </p>
        </div>
      </div>

      {/* Metrc ID check */}
      {!harvest.metrc_id ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm font-medium text-amber-700">Harvest not synced to Metrc yet</p>
          <p className="text-xs text-amber-600 mt-1">
            Sync this harvest to Metrc first before creating testing packages.
          </p>
          <Button size="sm" className="mt-2" asChild>
            <Link href={`/admin/grow/harvests/${id}`}>Go to Harvest</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Config */}
          <div className={`rounded-lg border-2 p-4 space-y-4 ${metrcEnv === "production" ? "border-blue-300 dark:border-blue-800" : "border-amber-200 dark:border-amber-900"}`}>
            <div className="flex items-end gap-3 flex-wrap">
              {envFacilities.length > 0 ? (
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-xs font-medium">License</label>
                  <Select value={license} onValueChange={setLicense}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select facility" />
                    </SelectTrigger>
                    <SelectContent>
                      {envFacilities.map((f) => (
                        <SelectItem key={f.id} value={f.metrc_license_number!}>
                          {f.name} — {f.metrc_license_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1 flex-1 min-w-[200px]">
                  <label className="text-xs font-medium">License</label>
                  <Input value={license} onChange={(e) => setLicense(e.target.value)} className="h-8 text-sm" placeholder="License number" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium">Environment</label>
                <div className="flex h-8 rounded-md border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => { setMetrcEnv("sandbox"); setLicense("") }}
                    className={`px-3 text-xs font-medium transition-colors ${metrcEnv === "sandbox" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    Sandbox
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMetrcEnv("production"); setLicense("") }}
                    className={`px-3 text-xs font-medium transition-colors ${metrcEnv === "production" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
                  >
                    Production
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2Icon className="size-3 text-green-600" />
              Metrc Harvest ID: {harvest.metrc_id}
            </div>
          </div>

          {/* Previously created packages */}
          {(harvest as any).testing_packages_created?.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                {(harvest as any).testing_packages_created.length} testing packages already created
              </p>
              <div className="rounded-md border divide-y bg-background">
                <div className="grid grid-cols-[1fr_80px_80px_1fr_120px] gap-3 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">
                  <span>Strain</span>
                  <span>Type</span>
                  <span>Grams</span>
                  <span>Package Tag</span>
                  <span>Created</span>
                </div>
                {(harvest as any).testing_packages_created.map((pkg: any, i: number) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_80px_1fr_120px] gap-3 px-4 py-2 items-center">
                    <span className="text-sm">{pkg.strain}</span>
                    <Badge variant="secondary" className="text-[10px] w-fit">
                      {pkg.test_type === "potency" ? "Potency" : "R&D"}
                    </Badge>
                    <span className="text-sm">{pkg.grams}g</span>
                    <span className="text-xs font-mono">{pkg.tag}</span>
                    <span className="text-xs text-muted-foreground">{new Date(pkg.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-amber-600 dark:text-amber-400/80">
                Duplicate strain + batch ID combinations will be skipped automatically.
              </p>
            </div>
          )}

          {/* Sample list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Samples</h2>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={addAllRnD}>
                  <PlusIcon className="size-3 mr-1" /> All R&D (15g)
                </Button>
                <Button size="sm" variant="outline" onClick={addAllPotency}>
                  <PlusIcon className="size-3 mr-1" /> All Potency (10g)
                </Button>
              </div>
            </div>

            {samples.length === 0 ? (
              <div className="rounded-lg border bg-muted/30 p-8 text-center">
                <FlaskConicalIcon className="size-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No samples configured. Click a button above or add strains manually.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border divide-y">
                {/* Header */}
                <div className="grid grid-cols-[1fr_80px_160px_120px_32px] gap-3 px-4 py-2.5 bg-muted/50 text-xs font-medium text-muted-foreground">
                  <span>Strain</span>
                  <span>Grams</span>
                  <span>Batch ID</span>
                  <span>Test Type</span>
                  <span />
                </div>
                {samples.map((sample, i) => (
                  <div key={i} className="grid grid-cols-[1fr_80px_160px_120px_32px] gap-3 px-4 py-2 items-center">
                    <div className="flex items-center gap-2">
                      <StrainAvatar name={sample.strain} size={22} />
                      <span className="text-sm font-medium">{sample.strain}</span>
                    </div>
                    <Input
                      type="number"
                      value={sample.grams}
                      onChange={(e) => {
                        const updated = [...samples]
                        updated[i] = { ...updated[i], grams: Number(e.target.value) }
                        setSamples(updated)
                      }}
                      className="h-7 text-xs"
                    />
                    <Input
                      value={sample.batch_id}
                      onChange={(e) => {
                        const updated = [...samples]
                        updated[i] = { ...updated[i], batch_id: e.target.value }
                        setSamples(updated)
                      }}
                      className="h-7 text-xs font-mono"
                    />
                    <select
                      value={sample.test_type}
                      onChange={(e) => {
                        const updated = [...samples]
                        updated[i] = {
                          ...updated[i],
                          test_type: e.target.value as "rnd" | "potency",
                          grams: e.target.value === "potency" ? 10 : 15,
                        }
                        setSamples(updated)
                      }}
                      className="h-7 text-xs rounded border bg-background px-2"
                    >
                      <option value="rnd">R&D (15g)</option>
                      <option value="potency">Potency (10g)</option>
                    </select>
                    <button
                      onClick={() => setSamples(samples.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-red-500"
                    >
                      <Trash2Icon className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {samples.length > 0 && (
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={creating || !license}
                className={metrcEnv === "production" ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                {creating ? (
                  <><LoaderIcon className="size-4 animate-spin mr-2" /> Creating...</>
                ) : (
                  <><FlaskConicalIcon className="size-4 mr-2" /> Create {samples.length} Sample Packages ({metrcEnv})</>
                )}
              </Button>
              <Button variant="ghost" onClick={() => setSamples([])}>Clear All</Button>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg border p-4 space-y-3 ${result.success ? "bg-green-50 dark:bg-green-900/20 border-green-200" : "bg-red-50 dark:bg-red-900/20 border-red-200"}`}>
              <div className="flex items-center gap-2">
                {result.success ? <CheckCircle2Icon className="size-5 text-green-600" /> : <AlertTriangleIcon className="size-5 text-red-600" />}
                <p className="font-semibold">
                  {result.success ? `${result.packages.length} sample packages created` : "Some packages failed"}
                </p>
              </div>

              {result.packages.length > 0 && (
                <div className="rounded-md border divide-y bg-background">
                  <div className="grid grid-cols-[1fr_80px_100px_1fr] gap-3 px-4 py-2 text-[10px] font-medium text-muted-foreground uppercase">
                    <span>Strain</span>
                    <span>Type</span>
                    <span>Grams</span>
                    <span>Package Tag (give to lab)</span>
                  </div>
                  {result.packages.map((pkg, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_100px_1fr] gap-3 px-4 py-3 items-center">
                      <div className="flex items-center gap-2">
                        <StrainAvatar name={pkg.strain} size={22} />
                        <div>
                          <span className="text-sm font-medium">{pkg.strain}</span>
                          <span className="text-[10px] text-muted-foreground block">{pkg.batch_id}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] w-fit">
                        {pkg.test_type === "potency" ? "Potency" : "R&D"}
                      </Badge>
                      <span className="text-sm">{pkg.grams}g</span>
                      <span className="text-sm font-mono font-bold text-green-700 dark:text-green-400">
                        {pkg.testing_tag}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.map((err, i) => (
                    <p key={i} className="text-sm text-red-600">{err}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && <ErrorAlert message={error} />}
        </>
      )}
    </div>
  )
}
