"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { apiClient, type Company } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewMenuPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [accessType, setAccessType] = useState<
    "company_member_only" | "anyone_with_link"
  >("anyone_with_link");
  const [status, setStatus] = useState<"draft" | "active" | "archived">(
    "active"
  );
  const [companyId, setCompanyId] = useState<number | null>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companySuggestions, setCompanySuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!companySearch.trim() || companySearch === companyName) {
      setCompanySuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const result = await apiClient.getCompanies({ q: companySearch, per_page: 10 });
        setCompanySuggestions(result.data);
        setShowSuggestions(true);
      } catch {
        // silently fail
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [companySearch, companyName]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await apiClient.createMenu({
        name: name.trim(),
        description: description.trim() || undefined,
        access_type: accessType,
        status,
        company_id: companyId || undefined,
        expires_at: expiresAt || undefined,
      });
      router.push(`/admin/menus/${created.slug}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create menu"
      );
      setIsSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="space-y-6 px-10">
      <div>
        <h2 className="text-2xl font-semibold">Create Menu</h2>
        <p className="text-sm text-muted-foreground">
          Create a new product menu for sharing with dispensaries
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-lg border bg-card p-6 space-y-5">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spring 2026 Menu"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description for this menu"
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
          </div>

          {/* Access Type */}
          <div className="space-y-3">
            <Label>Access Type</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="access_type"
                  value="company_member_only"
                  checked={accessType === "company_member_only"}
                  onChange={() => setAccessType("company_member_only")}
                  className="accent-primary"
                />
                Company Members Only
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="access_type"
                  value="anyone_with_link"
                  checked={accessType === "anyone_with_link"}
                  onChange={() => setAccessType("anyone_with_link")}
                  className="accent-primary"
                />
                Anyone with Link
              </label>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "draft" | "active" | "archived")
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Company (optional, search) */}
          <div className="space-y-2">
            <Label htmlFor="company">Company (optional)</Label>
            <div className="relative">
              <Input
                id="company"
                value={companySearch}
                onChange={(e) => {
                  setCompanySearch(e.target.value);
                  if (!e.target.value.trim()) {
                    setCompanyId(null);
                    setCompanyName("");
                  }
                }}
                onFocus={() => {
                  if (companySuggestions.length > 0) setShowSuggestions(true);
                }}
                onBlur={() => {
                  // Delay to allow click on suggestion
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                placeholder="Search for a company..."
                autoComplete="off"
              />
              {companyId && (
                <button
                  type="button"
                  onClick={() => {
                    setCompanyId(null);
                    setCompanyName("");
                    setCompanySearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
                >
                  ×
                </button>
              )}
              {showSuggestions && companySuggestions.length > 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                  {companySuggestions.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-left"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setCompanyId(c.id);
                        setCompanyName(c.name);
                        setCompanySearch(c.name);
                        setShowSuggestions(false);
                      }}
                    >
                      {c.logo_url && (
                        <img src={c.logo_url} alt="" className="size-5 rounded object-cover" />
                      )}
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Expires At */}
          <div className="space-y-2">
            <Label htmlFor="expires_at">Expires At (optional)</Label>
            <Input
              id="expires_at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Menu"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/menus">Cancel</Link>
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
