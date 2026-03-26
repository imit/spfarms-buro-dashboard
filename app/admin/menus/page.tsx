"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Menu,
  type MenuAccessType,
  type MenuStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ErrorAlert } from "@/components/ui/error-alert";
import { PlusIcon, Copy, MoreHorizontal, Star } from "lucide-react";

type StatusFilter = "all" | MenuStatus;

function statusVariant(status: MenuStatus) {
  switch (status) {
    case "active":
      return "default" as const;
    case "draft":
      return "secondary" as const;
    case "archived":
      return "outline" as const;
  }
}

function statusLabel(status: MenuStatus) {
  switch (status) {
    case "active":
      return "Active";
    case "draft":
      return "Draft";
    case "archived":
      return "Archived";
  }
}

function accessLabel(accessType: MenuAccessType) {
  switch (accessType) {
    case "company_member_only":
      return "Members Only";
    case "anyone_with_link":
      return "Public Link";
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function MenusPageWrapper() {
  return (
    <Suspense>
      <MenusPage />
    </Suspense>
  );
}

function MenusPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchMenus() {
      try {
        const data = await apiClient.getMenus();
        setMenus(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "We couldn't load menus"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchMenus();
  }, [isAuthenticated]);

  const filteredMenus = useMemo(() => {
    return menus.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      return true;
    });
  }, [menus, statusFilter]);

  function handleCopyShareUrl(menu: Menu, e: React.MouseEvent) {
    e.stopPropagation();
    if (!menu.share_url) return;
    navigator.clipboard.writeText(window.location.origin + menu.share_url);
    setCopiedId(menu.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Menus</h2>
          <p className="text-sm text-muted-foreground">
            Manage storefronts and product menus
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/menus/new">
            <PlusIcon className="mr-2 size-4" />
            Create Menu
          </Link>
        </Button>
      </div>

      {error && <ErrorAlert message={error} />}

      {!isLoading && menus.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border p-1">
            <Button
              variant={statusFilter === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("all")}
            >
              All
            </Button>
            <Button
              variant={statusFilter === "active" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("active")}
            >
              Active
            </Button>
            <Button
              variant={statusFilter === "draft" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("draft")}
            >
              Draft
            </Button>
            <Button
              variant={statusFilter === "archived" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter("archived")}
            >
              Archived
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : menus.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-muted-foreground">No menus yet.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/menus/new">Create your first menu</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Access</th>
                <th className="px-4 py-3 text-left font-medium">Items</th>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">Created</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMenus.map((m) => (
                <tr
                  key={m.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/admin/menus/${m.slug}`)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{m.name}</span>
                      {m.is_default && (
                        <Badge variant="outline" className="gap-1">
                          <Star className="size-3" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant(m.status)}>
                      {statusLabel(m.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {accessLabel(m.access_type)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.item_count}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {m.company_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {m.share_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0"
                          onClick={(e) => handleCopyShareUrl(m, e)}
                          title="Copy share URL"
                        >
                          <Copy className="size-4" />
                          {copiedId === m.id && (
                            <span className="sr-only">Copied!</span>
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0"
                        asChild
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <Link href={`/admin/menus/${m.slug}`}>
                          <MoreHorizontal className="size-4" />
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
