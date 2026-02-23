"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  apiClient,
  type MetrcTag,
  type MetrcTagStats,
  METRC_TAG_STATUS_LABELS,
  type MetrcTagStatus,
} from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TagImportDialog } from "@/components/grow/tag-import-dialog"
import { ArrowLeftIcon, PlusIcon, TagIcon, BanIcon } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { showError } from "@/lib/errors"

const STATUS_COLORS: Record<MetrcTagStatus, string> = {
  available: "bg-green-100 text-green-800",
  assigned: "bg-blue-100 text-blue-800",
  used: "bg-gray-100 text-gray-800",
  voided: "bg-red-100 text-red-800",
}

export default function MetrcTagsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [tags, setTags] = useState<MetrcTag[]>([])
  const [stats, setStats] = useState<MetrcTagStats | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [showImport, setShowImport] = useState(false)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/")
  }, [isAuthenticated, authLoading, router])

  const load = async () => {
    try {
      const [t, s] = await Promise.all([
        apiClient.getMetrcTags(statusFilter !== "all" ? { status: statusFilter } : undefined),
        apiClient.getMetrcTagStats(),
      ])
      setTags(t)
      setStats(s)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isAuthenticated) return
    load()
  }, [isAuthenticated, statusFilter])

  const handleVoid = async (tag: MetrcTag) => {
    if (!confirm(`Void tag ${tag.tag}?`)) return
    try {
      await apiClient.voidMetrcTag(tag.id)
      toast.success("Tag voided")
      load()
    } catch (err) {
      showError("void the tag", err)
    }
  }

  if (authLoading || !isAuthenticated) return null
  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Loading...</p></div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/grow">
              <ArrowLeftIcon className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">METRC Tags</h1>
            <p className="text-muted-foreground text-sm">Manage your METRC tracking tags</p>
          </div>
        </div>
        <Button onClick={() => setShowImport(true)}>
          <PlusIcon className="mr-2 h-4 w-4" /> Import Tags
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              <p className="text-muted-foreground text-xs">Available</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              <p className="text-muted-foreground text-xs">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-muted-foreground text-2xl font-bold">{stats.used}</p>
              <p className="text-muted-foreground text-xs">Used</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-2xl font-bold text-red-600">{stats.voided}</p>
              <p className="text-muted-foreground text-xs">Voided</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(METRC_TAG_STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-sm">{tags.length} tags</p>
      </div>

      {/* Table */}
      {tags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <TagIcon className="text-muted-foreground mx-auto mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              {statusFilter !== "all"
                ? `No ${METRC_TAG_STATUS_LABELS[statusFilter as MetrcTagStatus]?.toLowerCase()} tags`
                : "No METRC tags imported yet. Click Import Tags to add some."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plant</TableHead>
                <TableHead>Assigned By</TableHead>
                <TableHead>Assigned At</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tags.map((tag) => (
                <TableRow key={tag.id}>
                  <TableCell className="font-mono text-xs">{tag.tag}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[tag.status]}>
                      {METRC_TAG_STATUS_LABELS[tag.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tag.plant ? (
                      <Link href={`/admin/grow/plants/${tag.plant.id}`} className="text-primary hover:underline">
                        <span className="text-xs">{tag.plant.strain_name}</span>
                        <span className="text-muted-foreground ml-1 font-mono text-[10px]">{tag.plant.plant_uid}</span>
                      </Link>
                    ) : (
                      <span className="text-muted-foreground text-xs">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {tag.assigned_by
                      ? tag.assigned_by.full_name || tag.assigned_by.email
                      : "-"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {tag.assigned_at ? new Date(tag.assigned_at).toLocaleString() : "-"}
                  </TableCell>
                  <TableCell>
                    {tag.status === "available" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleVoid(tag)}
                      >
                        <BanIcon className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <TagImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImported={load}
      />
    </div>
  )
}
