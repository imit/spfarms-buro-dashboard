"use client";

import { useState, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import {
  useGooglePlacesAutocomplete,
  type PlaceResult,
} from "@/hooks/use-google-places-autocomplete";
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
import { CheckCircle2Icon, XIcon } from "lucide-react";

const TITLE_SUGGESTIONS = [
  "Owner",
  "Purchaser",
  "Manager",
  "Buyer",
  "Sales Rep",
  "General Manager",
];

export function OnboardRepresentativeForm() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { selectedPlace, clearPlace, isLoaded } =
    useGooglePlacesAutocomplete(searchInputRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    companyName: string;
    email: string;
  } | null>(null);

  // Dispensary mode: "search" (Google Places) or "manual" (type name)
  const [dispensaryMode, setDispensaryMode] = useState<"search" | "manual">(
    "search"
  );
  const [manualName, setManualName] = useState("");
  const [ocmLicense, setOcmLicense] = useState("");

  // Representative fields
  const [rep, setRep] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    company_title: "",
  });
  const [notes, setNotes] = useState("");

  function updateRep(field: string, value: string) {
    setRep((prev) => ({ ...prev, [field]: value }));
  }

  function handleClearPlace() {
    clearPlace();
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }

  function getCompanyName(): string {
    if (dispensaryMode === "manual") return manualName;
    return selectedPlace?.name || "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const companyName = getCompanyName();
    if (!companyName) {
      setError("Please select or enter a dispensary name.");
      return;
    }
    if (!rep.full_name || !rep.email) {
      setError("Full name and email are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Parameters<typeof apiClient.onboardRepresentative>[0] = {
        company: {
          name: companyName,
          license_number: ocmLicense || undefined,
          website: selectedPlace?.website || undefined,
          phone_number: selectedPlace?.phone_number || undefined,
        },
        representative: {
          full_name: rep.full_name,
          email: rep.email,
          phone_number: rep.phone_number || undefined,
          company_title: rep.company_title || undefined,
        },
      };

      // Add location data from Google Places
      if (selectedPlace?.address) {
        payload.location = {
          address: selectedPlace.address,
          city: selectedPlace.city,
          state: selectedPlace.state,
          zip_code: selectedPlace.zip_code,
          latitude: selectedPlace.latitude,
          longitude: selectedPlace.longitude,
        };
      }

      await apiClient.onboardRepresentative(payload);

      setSuccess({
        companyName,
        email: rep.email,
      });

      // Reset form
      handleClearPlace();
      setManualName("");
      setOcmLicense("");
      setRep({ full_name: "", email: "", phone_number: "", company_title: "" });
      setNotes("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to onboard representative"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg rounded-lg border bg-card p-8 text-center space-y-4">
        <CheckCircle2Icon className="mx-auto size-12 text-green-600" />
        <h3 className="text-lg font-semibold">Representative Onboarded</h3>
        <p className="text-sm text-muted-foreground">
          <strong>{success.companyName}</strong> has been created and a welcome
          email with a login link has been sent to{" "}
          <strong>{success.email}</strong>.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={() => setSuccess(null)}>Onboard Another</Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/companies")}
          >
            View Companies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
          {error}
        </div>
      )}

      {/* Section 1: Dispensary */}
      <section className="space-y-4">
        {dispensaryMode === "search" ? (
          <>
            <Field>
              <FieldLabel htmlFor="dispensary-search">
                Search for dispensary
              </FieldLabel>
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
                    onClick={handleClearPlace}
                    className="rounded-full p-1 hover:bg-muted-foreground/20"
                  >
                    <XIcon className="size-4 text-muted-foreground" />
                  </button>
                </div>
              ) : (
                <Input
                  ref={searchInputRef}
                  id="dispensary-search"
                  placeholder={
                    isLoaded
                      ? "Start typing a dispensary name..."
                      : "Loading Google Places..."
                  }
                  disabled={!isLoaded || isSubmitting}
                />
              )}
            </Field>
            <button
              type="button"
              onClick={() => setDispensaryMode("manual")}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Enter name manually
            </button>
          </>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="manual-name">Dispensary name</FieldLabel>
              <Input
                id="manual-name"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Green Leaf NYC"
                required
                disabled={isSubmitting}
              />
            </Field>
            <button
              type="button"
              onClick={() => setDispensaryMode("search")}
              className="text-sm text-muted-foreground underline hover:text-foreground"
            >
              Search with Google Places instead
            </button>
          </>
        )}

        <Field>
          <FieldLabel htmlFor="ocm-license">OCM License</FieldLabel>
          <Input
            id="ocm-license"
            value={ocmLicense}
            onChange={(e) => setOcmLicense(e.target.value)}
            placeholder="OCM-XXXXX"
            disabled={isSubmitting}
          />
        </Field>
      </section>

      {/* Section 2: Representative */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium">Representative</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="full_name">Full name *</FieldLabel>
            <Input
              id="full_name"
              value={rep.full_name}
              onChange={(e) => updateRep("full_name", e.target.value)}
              placeholder="John Doe"
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="rep-email">Email *</FieldLabel>
            <Input
              id="rep-email"
              type="email"
              value={rep.email}
              onChange={(e) => updateRep("email", e.target.value)}
              placeholder="john@greenleaf.com"
              required
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="rep-phone">Phone number</FieldLabel>
            <Input
              id="rep-phone"
              type="tel"
              value={rep.phone_number}
              onChange={(e) => updateRep("phone_number", e.target.value)}
              placeholder="(212) 555-0123"
              disabled={isSubmitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="company_title">Title</FieldLabel>
            <Select
              value={rep.company_title}
              onValueChange={(v) => updateRep("company_title", v)}
            >
              <SelectTrigger id="company_title" className="w-full">
                <SelectValue placeholder="Select a title..." />
              </SelectTrigger>
              <SelectContent>
                {TITLE_SUGGESTIONS.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Notes</FieldLabel>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this representative..."
              rows={3}
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
      </section>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account..." : "Submit"}
      </Button>
    </form>
  );
}
