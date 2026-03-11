"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { apiClient, type AuditEventData, AUDIT_EVENT_LABELS } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShieldAlertIcon } from "lucide-react"

const PAGE_SIZE = 50

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Events",
  users: "User Management",
  companies: "Companies",
  grow: "Grow",
}

const EVENT_CATEGORY_COLORS: Partial<Record<string, string>> = {
  user_created: "bg-green-100 text-green-800",
  user_updated: "bg-blue-100 text-blue-800",
  user_deleted: "bg-red-100 text-red-800",
  user_role_changed: "bg-purple-100 text-purple-800",
  user_impersonated: "bg-orange-100 text-orange-800",
  user_invited: "bg-cyan-100 text-cyan-800",
  company_created: "bg-green-100 text-green-800",
  company_updated: "bg-blue-100 text-blue-800",
  company_deleted: "bg-red-100 text-red-800",
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function AuditLogPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [events, setEvents] = useState<AuditEventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [category, setCategory] = useState("all")
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/admin")
    }
  }, [isAuthenticated, authLoading, user, router])

  useEffect(() => {
    if (!isAuthenticated || user?.role !== "admin") return
    async function load() {
      setIsLoading(true)
      try {
        const res = await apiClient.getAdminAuditEvents({
          category: category !== "all" ? (category as "users" | "companies" | "grow") : undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
          limit: PAGE_SIZE,
          offset,
        })
        setEvents(res.data)
        setTotal(res.meta.total)
      } catch {
        // silently fail
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [isAuthenticated, user, category, fromDate, toDate, offset])

  if (authLoading || !isAuthenticated || user?.role !== "admin") return null

  function resetFilters() {
    setCategory("all")
    setFromDate("")
    setToDate("")
    setOffset(0)
  }

  const hasActiveFilters = category !== "all" || fromDate || toDate

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start gap-3">
        <ShieldAlertIcon className="h-6 w-6 mt-1 text-muted-foreground" />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-muted-foreground text-sm">Complete record of all user actions — admin only</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Select value={category} onValueChange={(v) => { setCategory(v); setOffset(0) }}>
          <SelectTrigger className="w-44 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setOffset(0) }}
            className="h-8 text-xs w-36"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <Input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setOffset(0) }}
            className="h-8 text-xs w-36"
          />
        </div>
        {hasActiveFilters && (
          <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={resetFilters}>
            Clear filters
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">{total} events</span>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <p className="text-muted-foreground text-sm">No events found.</p>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                <th className="text-left px-4 py-2 font-medium">Event</th>
                <th className="text-left px-4 py-2 font-medium">Actor</th>
                <th className="text-left px-4 py-2 font-medium">Subject</th>
                <th className="text-left px-4 py-2 font-medium">Details</th>
                <th className="text-right px-4 py-2 font-medium">When</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => (
                <tr key={event.id} className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                  <td className="px-4 py-2.5">
                    <Badge
                      variant="secondary"
                      className={`text-xs font-normal ${EVENT_CATEGORY_COLORS[event.event_type] ?? ""}`}
                    >
                      {AUDIT_EVENT_LABELS[event.event_type] ?? event.event_type}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-xs">{event.user?.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{event.user?.email}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    {event.trackable_name ? (
                      <div className="text-xs">
                        <span className="text-muted-foreground">{event.trackable_type} · </span>
                        {event.trackable_name}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 max-w-xs">
                    {event.metadata && Object.keys(event.metadata).length > 0 ? (
                      <div className="text-xs text-muted-foreground truncate">
                        {Object.entries(event.metadata)
                          .filter(([, v]) => v !== null && v !== undefined)
                          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" → ") : String(v)}`)
                          .join(", ")}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                    {event.notes && <div className="text-xs italic mt-0.5">{event.notes}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(event.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
