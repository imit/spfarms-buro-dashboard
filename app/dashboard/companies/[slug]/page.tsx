"use client";

import { useEffect, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Company,
  COMPANY_TYPE_LABELS,
  REGION_LABELS,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeftIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  Trash2Icon,
} from "lucide-react";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{value}</dd>
    </div>
  );
}

export default function CompanyDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    async function fetchCompany() {
      try {
        const data = await apiClient.getCompany(slug);
        setCompany(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load company"
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompany();
  }, [isAuthenticated, slug]);

  async function handleDelete() {
    if (!company) return;
    setIsDeleting(true);
    try {
      await apiClient.deleteCompany(company.slug);
      router.push("/dashboard/companies");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete company"
      );
      setIsDeleting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/companies">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Companies
          </Link>
        </Button>
      </div>
    );
  }

  if (!company) return null;

  const socialEntries = Object.entries(company.social_media || {}).filter(
    ([, v]) => v
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon-sm" asChild>
              <Link href="/dashboard/companies">
                <ArrowLeftIcon className="size-4" />
              </Link>
            </Button>
            <h2 className="text-2xl font-semibold">{company.name}</h2>
            <Badge variant="outline">
              {COMPANY_TYPE_LABELS[company.company_type]}
            </Badge>
            <Badge variant={company.active ? "default" : "secondary"}>
              {company.active ? "Active" : "Inactive"}
            </Badge>
          </div>
          {company.description && (
            <p className="text-sm text-muted-foreground ml-11">
              {company.description}
            </p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isDeleting}>
              <Trash2Icon className="mr-2 size-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete company?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete {company.name} and all its
                locations. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Details */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Details</h3>
          <Separator className="mb-1" />
          <dl>
            <DetailRow
              label="Type"
              value={COMPANY_TYPE_LABELS[company.company_type]}
            />
            <DetailRow label="License #" value={company.license_number} />
            <DetailRow label="Slug" value={company.slug} />
            <DetailRow
              label="Created"
              value={new Date(company.created_at).toLocaleDateString()}
            />
          </dl>
        </div>

        {/* Contact */}
        <div className="rounded-lg border bg-card p-5">
          <h3 className="font-medium mb-3">Contact</h3>
          <Separator className="mb-3" />
          <div className="space-y-3">
            {company.email && (
              <div className="flex items-center gap-2 text-sm">
                <MailIcon className="size-4 text-muted-foreground shrink-0" />
                <a
                  href={`mailto:${company.email}`}
                  className="text-primary hover:underline"
                >
                  {company.email}
                </a>
              </div>
            )}
            {company.phone_number && (
              <div className="flex items-center gap-2 text-sm">
                <PhoneIcon className="size-4 text-muted-foreground shrink-0" />
                <span>{company.phone_number}</span>
              </div>
            )}
            {company.website && (
              <div className="flex items-center gap-2 text-sm">
                <GlobeIcon className="size-4 text-muted-foreground shrink-0" />
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {company.website}
                </a>
              </div>
            )}
            {!company.email && !company.phone_number && !company.website && (
              <p className="text-sm text-muted-foreground">
                No contact info added.
              </p>
            )}
          </div>
        </div>

        {/* Social Media */}
        {socialEntries.length > 0 && (
          <div className="rounded-lg border bg-card p-5">
            <h3 className="font-medium mb-3">Social Media</h3>
            <Separator className="mb-1" />
            <dl>
              {socialEntries.map(([platform, handle]) => (
                <DetailRow
                  key={platform}
                  label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={handle}
                />
              ))}
            </dl>
          </div>
        )}
      </div>

      {/* Locations */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Locations</h3>
        {!company.locations || company.locations.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No locations added yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {company.locations.map((loc, i) => {
              const fullAddress = [loc.address, loc.city, loc.state, loc.zip_code]
                .filter(Boolean)
                .join(", ");

              return (
                <div key={loc.id ?? i} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">
                      {loc.name || `Location ${i + 1}`}
                    </span>
                    {loc.region && (
                      <Badge variant="outline" className="text-xs">
                        {REGION_LABELS[loc.region]}
                      </Badge>
                    )}
                  </div>
                  {fullAddress && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPinIcon className="size-3.5 mt-0.5 shrink-0" />
                      <span>{fullAddress}</span>
                    </div>
                  )}
                  {loc.phone_number && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <PhoneIcon className="size-3.5 shrink-0" />
                      <span>{loc.phone_number}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
