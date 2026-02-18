"use client";

import { useState, useRef, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { UserCombobox } from "@/components/user-combobox";
import {
  useGooglePlacesAutocomplete,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2Icon, ChevronsUpDownIcon, CheckIcon, XIcon, SearchIcon, PlusIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const TITLE_SUGGESTIONS = [
  "Owner",
  "Purchaser",
  "Manager",
  "Buyer",
  "Sales Rep",
  "General Manager",
];

type DispensaryMode = "existing" | "google" | "manual";

export function OnboardRepresentativeForm() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { selectedPlace, clearPlace, isLoaded } =
    useGooglePlacesAutocomplete(searchInputRef);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    companyName: string;
    companySlug: string;
    email: string;
    emailSent: boolean;
    isExisting: boolean;
  } | null>(null);

  const [referredById, setReferredById] = useState<string>("");

  // Dispensary mode: "existing" (pick from DB), "google" (Google Places), or "manual"
  const [dispensaryMode, setDispensaryMode] = useState<DispensaryMode>("existing");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [companyOpen, setCompanyOpen] = useState(false);
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
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    apiClient.getCompanies().then(setCompanies).catch(() => {});
  }, []);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);

  function updateRep(field: string, value: string) {
    setRep((prev) => ({ ...prev, [field]: value }));
  }

  function handleClearPlace() {
    clearPlace();
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  }

  function switchMode(mode: DispensaryMode) {
    setDispensaryMode(mode);
    setSelectedCompanyId(null);
    handleClearPlace();
    setManualName("");
  }

  function getCompanyName(): string {
    if (dispensaryMode === "existing") return selectedCompany?.name || "";
    if (dispensaryMode === "manual") return manualName;
    return selectedPlace?.name || "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(null);

    const companyName = getCompanyName();
    if (dispensaryMode === "existing" && !selectedCompanyId) {
      setError("Please select a company.");
      return;
    }
    if (dispensaryMode !== "existing" && !companyName) {
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
        representative: {
          full_name: rep.full_name,
          email: rep.email,
          phone_number: rep.phone_number || undefined,
          company_title: rep.company_title || undefined,
        },
        send_email: sendEmail,
      };

      if (dispensaryMode === "existing" && selectedCompanyId) {
        payload.company_id = selectedCompanyId;
      } else {
        payload.company = {
          name: companyName,
          license_number: ocmLicense || undefined,
          website: selectedPlace?.website || undefined,
          phone_number: selectedPlace?.phone_number || undefined,
        };
        payload.referred_by_id = referredById ? Number(referredById) : undefined;

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
      }

      const result = await apiClient.onboardRepresentative(payload);

      setSuccess({
        companyName: companyName || result.company.name,
        companySlug: result.company.slug,
        email: rep.email,
        emailSent: sendEmail,
        isExisting: dispensaryMode === "existing",
      });

      // Reset form
      handleClearPlace();
      setSelectedCompanyId(null);
      setManualName("");
      setOcmLicense("");
      setRep({ full_name: "", email: "", phone_number: "", company_title: "" });
      setNotes("");
      setSendEmail(false);
      setReferredById("");
      setDispensaryMode("existing");
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
          {success.isExisting ? (
            <>A new representative has been added to <strong>{success.companyName}</strong></>
          ) : (
            <><strong>{success.companyName}</strong> has been created</>
          )}
          {success.emailSent ? (
            <> and a welcome email with a login link has been sent to{" "}
            <strong>{success.email}</strong></>
          ) : (
            <>. No invitation email was sent to{" "}
            <strong>{success.email}</strong> &mdash; you can send it later from the user&apos;s profile</>
          )}.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={() => setSuccess(null)}>Onboard Another</Button>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/companies/${success.companySlug}`)}
          >
            View Company
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
      {error && (
        <div className="bg-destructive/10 text-destructive rounded-md p-3 text-base">
          {error}
        </div>
      )}

      {/* Section 1: Dispensary */}
      <section className="space-y-4">
        {dispensaryMode === "existing" && (
          <>
            <Field>
              <FieldLabel>Dispensary</FieldLabel>
              <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={companyOpen}
                    className="w-full h-12 text-base justify-between font-normal"
                    disabled={isSubmitting}
                  >
                    {selectedCompany ? (
                      <span className="truncate">{selectedCompany.name}</span>
                    ) : (
                      <span className="text-muted-foreground">Search companies...</span>
                    )}
                    <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search companies..." />
                    <CommandList>
                      <CommandEmpty>
                        <p className="text-sm text-muted-foreground">No companies found.</p>
                      </CommandEmpty>
                      <CommandGroup>
                        {companies
                          .filter((c) => !c.deleted_at)
                          .map((c) => (
                            <CommandItem
                              key={c.id}
                              value={c.name}
                              onSelect={() => {
                                setSelectedCompanyId(c.id === selectedCompanyId ? null : c.id);
                                setCompanyOpen(false);
                              }}
                            >
                              <CheckIcon
                                className={cn(
                                  "mr-2 size-4",
                                  selectedCompanyId === c.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="truncate">
                                <span>{c.name}</span>
                                {c.locations[0]?.city && (
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {c.locations[0].city}, {c.locations[0].state}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </Field>
            {selectedCompany && (
              <div className="rounded-md border bg-muted/50 px-4 py-3 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-base font-medium truncate">{selectedCompany.name}</p>
                  {selectedCompany.locations[0] && (
                    <p className="text-xs text-muted-foreground truncate">
                      {[
                        selectedCompany.locations[0].address,
                        selectedCompany.locations[0].city,
                        selectedCompany.locations[0].state,
                      ].filter(Boolean).join(", ")}
                    </p>
                  )}
                  {selectedCompany.members.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCompany.members.length} existing {selectedCompany.members.length === 1 ? "member" : "members"}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCompanyId(null)}
                  className="rounded-full p-1 hover:bg-muted-foreground/20"
                >
                  <XIcon className="size-4 text-muted-foreground" />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => switchMode("google")}
              className="inline-flex items-center gap-2 rounded-md border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 hover:border-primary/60 transition-colors"
            >
              <PlusIcon className="size-4" />
              Not in the system? Add from Google Places
            </button>
          </>
        )}

        {dispensaryMode === "google" && (
          <>
            <Field>
              <FieldLabel htmlFor="dispensary-search">
                Search Google Places
              </FieldLabel>
              {selectedPlace ? (
                <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium truncate">
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
                  className="h-12 text-base"
                  placeholder={
                    isLoaded
                      ? "Start typing a dispensary name..."
                      : "Loading Google Places..."
                  }
                  disabled={!isLoaded || isSubmitting}
                />
              )}
            </Field>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => switchMode("existing")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <SearchIcon className="size-4" />
                Search existing companies
              </button>
              <button
                type="button"
                onClick={() => switchMode("manual")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Enter name manually
              </button>
            </div>
          </>
        )}

        {dispensaryMode === "manual" && (
          <>
            <Field>
              <FieldLabel htmlFor="manual-name">Dispensary name</FieldLabel>
              <Input
                id="manual-name"
                className="h-12 text-base"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="Green Leaf NYC"
                required
                disabled={isSubmitting}
              />
            </Field>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => switchMode("existing")}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <SearchIcon className="size-4" />
                Search existing companies
              </button>
              <button
                type="button"
                onClick={() => switchMode("google")}
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Search Google Places
              </button>
            </div>
          </>
        )}
      </section>

      {/* Section 2: Representative */}
      <section className="space-y-4">
        <h3 className="text-xl font-medium">Representative</h3>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="full_name">Full name *</FieldLabel>
            <Input
              id="full_name"
              className="h-12 text-base"
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
              className="h-12 text-base"
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
              className="h-12 text-base"
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
              <SelectTrigger id="company_title" className="w-full h-12 text-base">
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
              className="text-base"
              rows={3}
              disabled={isSubmitting}
            />
          </Field>
        </FieldGroup>
        {dispensaryMode !== "existing" && (
          <Field>
            <FieldLabel htmlFor="ocm-license">OCM License</FieldLabel>
            <Input
              id="ocm-license"
              className="h-12 text-base"
              value={ocmLicense}
              onChange={(e) => setOcmLicense(e.target.value)}
              placeholder="OCM-XXXXX"
              disabled={isSubmitting}
            />
          </Field>
        )}
      </section>

      {/* Referred by (admin only, new companies only) */}
      {currentUser?.role === "admin" && dispensaryMode !== "existing" && (
        <section className="space-y-4">
          <Field>
            <FieldLabel>Referred by</FieldLabel>
            <UserCombobox
              value={referredById}
              onValueChange={setReferredById}
              placeholder="Myself (default)"
              disabled={isSubmitting}
            />
          </Field>
        </section>
      )}

      {/* Send email option */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="send-email"
          checked={sendEmail}
          onCheckedChange={(checked) => setSendEmail(checked === true)}
          disabled={isSubmitting}
        />
        <label
          htmlFor="send-email"
          className="text-base cursor-pointer select-none"
        >
          Send invitation email with login link
        </label>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-14 text-lg font-semibold"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating account..." : "Submit"}
      </Button>
    </form>
  );
}
