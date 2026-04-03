"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type AppSettings } from "@/lib/api"
import { MetrcSettingsSection } from "@/components/settings/metrc-settings-section"
import { Button } from "@/components/ui/button"
import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

export default function MetrcSettingsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  const load = async () => {
    try {
      const s = await apiClient.getSettings()
      setSettings(s)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated])

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="px-10"><p className="text-muted-foreground">Loading...</p></div>

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/settings">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Metrc Settings</h2>
          <p className="text-sm text-muted-foreground">
            API keys, environment configuration, and facility licenses
          </p>
        </div>
      </div>

      <MetrcSettingsSection settings={settings} onUpdate={load} />
    </div>
  )
}
