"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type Company,
  type Region,
  type CompanyType,
  REGION_LABELS,
  COMPANY_TYPE_LABELS,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useGooglePlacesAutocomplete } from "@/hooks/use-google-places-autocomplete";
import { UserCombobox } from "@/components/user-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { XIcon } from "lucide-react";

const REGIONS = Object.entries(REGION_LABELS) as [Region, string][];
const COMPANY_TYPES = Object.entries(COMPANY_TYPE_LABELS) as [CompanyType, string][];

interface CompanyFormProps {
  company?: Company;
  mode?: "create" | "edit";
}

export function CompanyForm({ company, mode = "create" }: CompanyFormProps) {
  const isEdit = mode === "edit";
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [referredById, setReferredById] = useState<string>(
    company?.referred_by?.id ? String(company.referred_by.id) : ""
  );

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { selectedPlace, clearPlace, isLoaded } =
    useGooglePlacesAutocomplete(searchInputRef);

  const firstLocation = company?.locations?.[0];

  const [form, setForm] = useState({
    name: company?.name ?? "",
    company_type: (company?.company_type ?? "dispensary") as CompanyType,
    website: company?.website ?? "",
    description: company?.description ?? "",
    phone_number: company?.phone_number ?? "",
    email: company?.email ?? "",
    license_number: company?.license_number ?? "",
    social_media: {
      instagram: company?.social_media?.instagram ?? "",
      twitter: company?.social_media?.twitter ?? "",
      facebook: company?.social_media?.facebook ?? "",
    },
    location: {
      id: firstLocation?.id ?? null as number | null,
      address: firstLocation?.address ?? "",
      city: firstLocation?.city ?? "",
      state: firstLocation?.state ?? "NY",
      zip_code: firstLocation?.zip_code ?? "",
      region: (firstLocation?.region ?? "") as Region | "",
      latitude: firstLocation?.latitude ?? null as number | null,
      longitude: firstLocation?.longitude ?? null as number | null,
    },
  });

  // Auto-fill form when a Google Place is selected
  const lastPlaceId = useRef<string | null>(null);
  if (selectedPlace && selectedPlace.place_id !== lastPlaceId.current) {
    lastPlaceId.current = selectedPlace.place_id;
    setForm((prev) => ({
      ...prev,
      name: selectedPlace.name || prev.name,
      website: selectedPlace.website || prev.website,
      phone_number: selectedPlace.phone_number || prev.phone_number,
      location: {
        ...prev.location,
        address: selectedPlace.address || prev.location.address,
        city: selectedPlace.city || prev.location.city,
        state: selectedPlace.state || prev.location.state,
        zip_code: selectedPlace.zip_code || prev.location.zip_code,
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
      },
    }));
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLocation(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  }

  function updateSocial(platform: string, value: string) {
    setForm((prev) => ({
      ...prev,
      social_media: { ...prev.social_media, [platform]: value },
    }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const socialMedia = Object.fromEntries(
        Object.entries(form.social_media).filter(([, v]) => v.trim() !== "")
      );

      // Build location attributes if any address field is filled
      const loc = form.location;
      const hasLocation = loc.address || loc.city || loc.zip_code;

      const payload: Record<string, unknown> = {
        name: form.name,
        company_type: form.company_type,
        website: form.website || undefined,
        description: form.description || undefined,
        phone_number: form.phone_number || undefined,
        email: form.email || undefined,
        license_number: form.license_number || undefined,
        social_media: socialMedia,
        ...(currentUser?.role === "admin" && { referred_by_id: referredById ? Number(referredById) : null }),
      };

      if (hasLocation) {
        payload.locations_attributes = [
          {
            ...(form.location.id ? { id: form.location.id } : {}),
            address: loc.address || undefined,
            city: loc.city || undefined,
            state: loc.state || undefined,
            zip_code: loc.zip_code || undefined,
            region: loc.region || undefined,
            latitude: loc.latitude || undefined,
            longitude: loc.longitude || undefined,
          },
        ];
      }

      if (isEdit && company) {
        await apiClient.updateCompany(company.slug, payload);
        router.push(`/admin/companies/${company.slug}`);
      } else {
        await apiClient.createCompany(payload);
        router.push("/admin/companies");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${isEdit ? "update" : "create"} company`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Name *</FieldLabel>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Green Leaf NYC"
                required
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="company_type">Type *</FieldLabel>
              <Select
                value={form.company_type}
                onValueChange={(v) => updateField("company_type", v)}
              >
                <SelectTrigger id="company_type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COMPANY_TYPES.map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="license_number">License Number</FieldLabel>
            <Input
              id="license_number"
              value={form.license_number}
              onChange={(e) => updateField("license_number", e.target.value)}
              placeholder="OCM-XXXXX"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description..."
              disabled={isSubmitting}
              rows={3}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* Location */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Location</h3>
        <FieldGroup>
          {!isEdit && (
            <Field>
              <FieldLabel htmlFor="place-search">Search Google Places</FieldLabel>
              {selectedPlace ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedPlace.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        selectedPlace.address,
                        selectedPlace.city,
                        selectedPlace.state,
                        selectedPlace.zip_code,
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      clearPlace();
                      lastPlaceId.current = null;
                      if (searchInputRef.current) searchInputRef.current.value = "";
                    }}
                    className="rounded-full p-1 hover:bg-muted-foreground/20"
                  >
                    <XIcon className="size-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Input
                  ref={searchInputRef}
                  id="place-search"
                  placeholder={
                    isLoaded
                      ? "Start typing a business name..."
                      : "Loading Google Places..."
                  }
                  disabled={!isLoaded || isSubmitting}
                />
              )}
            </Field>
          )}
          <Field>
            <FieldLabel htmlFor="address">Street Address</FieldLabel>
            <Input
              id="address"
              value={form.location.address}
              onChange={(e) => updateLocation("address", e.target.value)}
              placeholder="123 Main St"
              disabled={isSubmitting}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="city">City</FieldLabel>
              <Input
                id="city"
                value={form.location.city}
                onChange={(e) => updateLocation("city", e.target.value)}
                placeholder="New York"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="state">State</FieldLabel>
              <Input
                id="state"
                value={form.location.state}
                onChange={(e) => updateLocation("state", e.target.value)}
                placeholder="NY"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="zip_code">ZIP Code</FieldLabel>
              <Input
                id="zip_code"
                value={form.location.zip_code}
                onChange={(e) => updateLocation("zip_code", e.target.value)}
                placeholder="10001"
                disabled={isSubmitting}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="region">Region</FieldLabel>
            <Select
              value={form.location.region}
              onValueChange={(v) => updateLocation("region", v)}
            >
              <SelectTrigger id="region" className="w-full">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>
      </section>

      {/* Contact */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Contact</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="info@greenleaf.com"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="phone_number">Phone Number</FieldLabel>
              <Input
                id="phone_number"
                value={form.phone_number}
                onChange={(e) => updateField("phone_number", e.target.value)}
                placeholder="(212) 555-0123"
                disabled={isSubmitting}
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="website">Website</FieldLabel>
            <Input
              id="website"
              value={form.website}
              onChange={(e) => updateField("website", e.target.value)}
              placeholder="https://greenleaf.com"
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* Social Media */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Social Media</h3>
        <FieldGroup>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="instagram">Instagram</FieldLabel>
              <Input
                id="instagram"
                value={form.social_media.instagram}
                onChange={(e) => updateSocial("instagram", e.target.value)}
                placeholder="@greenleafnyc"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="twitter">X / Twitter</FieldLabel>
              <Input
                id="twitter"
                value={form.social_media.twitter}
                onChange={(e) => updateSocial("twitter", e.target.value)}
                placeholder="@greenleafnyc"
                disabled={isSubmitting}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="facebook">Facebook</FieldLabel>
              <Input
                id="facebook"
                value={form.social_media.facebook}
                onChange={(e) => updateSocial("facebook", e.target.value)}
                placeholder="greenleafnyc"
                disabled={isSubmitting}
              />
            </Field>
          </div>
        </FieldGroup>
      </section>

      {/* Referred by (admin only) */}
      {currentUser?.role === "admin" && (
        <section className="space-y-4">
          <Field>
            <FieldLabel>Referred by</FieldLabel>
            <UserCombobox
              value={referredById}
              onValueChange={setReferredById}
              placeholder="Select referrer..."
              disabled={isSubmitting}
            />
          </Field>
        </section>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? isEdit ? "Saving..." : "Creating..."
            : isEdit ? "Save Changes" : "Create Company"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(isEdit && company ? `/admin/companies/${company.slug}` : "/admin/companies")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
