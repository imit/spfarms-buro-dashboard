"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Company } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
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
import {
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  CheckIcon,
  XIcon,
  PlusIcon,
  SendIcon,
  StickyNoteIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function OnboardRepresentativeForm() {
  const router = useRouter();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    companyName: string;
    companySlug: string;
    email: string;
    emailSent: boolean;
    isExisting: boolean;
  } | null>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );
  const [newCompanyName, setNewCompanyName] = useState("");
  const [companySearch, setCompanySearch] = useState("");

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  useEffect(() => {
    apiClient
      .getCompanies({ per_page: 100 })
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }, []);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const isNewCompany = !!newCompanyName && !selectedCompanyId;

  function selectCompany(company: Company) {
    setSelectedCompanyId(company.id);
    setNewCompanyName("");
    setCompanyOpen(false);
  }

  function createNewFromSearch() {
    setNewCompanyName(companySearch);
    setSelectedCompanyId(null);
    setCompanyOpen(false);
  }

  function clearCompany() {
    setSelectedCompanyId(null);
    setNewCompanyName("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!selectedCompanyId && !newCompanyName) {
      setError("Pick a company or create a new one.");
      return;
    }
    if (!email) {
      setError("Email is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Parameters<typeof apiClient.onboardRepresentative>[0] = {
        representative: {
          full_name: fullName || email.split("@")[0],
          email,
        },
        send_email: sendEmail,
      };

      if (selectedCompanyId) {
        payload.company_id = selectedCompanyId;
      } else {
        payload.company = { name: newCompanyName };
      }

      const result = await apiClient.onboardRepresentative(payload);
      const companyName =
        selectedCompany?.name || newCompanyName || result.company?.name || "";

      setSuccess({
        companyName,
        companySlug: result.company?.slug || "",
        email,
        emailSent: sendEmail,
        isExisting: !!selectedCompanyId,
      });

      // Reset
      clearCompany();
      setEmail("");
      setFullName("");
      setNote("");
      setShowNote(false);
      setSendEmail(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg rounded-lg border bg-card p-8 text-center space-y-4">
        <CheckCircle2Icon className="mx-auto size-12 text-green-600" />
        <h3 className="text-lg font-semibold">Done</h3>
        <p className="text-sm text-muted-foreground">
          <strong>{success.email}</strong> added to{" "}
          <strong>{success.companyName}</strong>
          {success.emailSent
            ? ". Login link sent."
            : ". No email sent — send later from their profile."}
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={() => setSuccess(null)}>Add Another</Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push(`/admin/companies/${success.companySlug}`)
            }
          >
            View Company
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      {error && <ErrorAlert message={error} />}

      {/* Company picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Company</label>
        {isNewCompany ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Input
                className="h-12 text-base flex-1"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Company name"
                autoFocus
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={clearCompany}
                className="rounded-full p-1.5 hover:bg-muted-foreground/20 shrink-0"
              >
                <XIcon className="size-4 text-muted-foreground" />
              </button>
            </div>
            <p className="text-xs text-green-600 px-1">New company</p>
          </div>
        ) : selectedCompany ? (
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-4 py-3">
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium truncate">
                {selectedCompany.name}
              </p>
              {selectedCompany.locations[0]?.city && (
                <p className="text-xs text-muted-foreground truncate">
                  {selectedCompany.locations[0].city},{" "}
                  {selectedCompany.locations[0].state}
                </p>
              )}
              {selectedCompany.members.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedCompany.members.length}{" "}
                  {selectedCompany.members.length === 1
                    ? "member"
                    : "members"}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={clearCompany}
              className="rounded-full p-1 hover:bg-muted-foreground/20"
            >
              <XIcon className="size-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <Popover open={companyOpen} onOpenChange={setCompanyOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={companyOpen}
                className="w-full h-12 text-base justify-between font-normal"
                disabled={isSubmitting}
              >
                <span className="text-muted-foreground">
                  Search or create...
                </span>
                <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-(--radix-popover-trigger-width) p-0"
              align="start"
            >
              <Command>
                <CommandInput
                  placeholder="Type a company name..."
                  value={companySearch}
                  onValueChange={setCompanySearch}
                />
                <CommandList>
                  <CommandEmpty>
                    {companySearch.trim() ? (
                      <button
                        type="button"
                        onClick={createNewFromSearch}
                        className="flex w-full items-center gap-2 px-2 py-3 text-sm hover:bg-accent rounded-sm"
                      >
                        <PlusIcon className="size-4 text-green-600" />
                        Create &ldquo;{companySearch.trim()}&rdquo;
                      </button>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Start typing...
                      </p>
                    )}
                  </CommandEmpty>
                  <CommandGroup>
                    {companies
                      .filter((c) => !c.deleted_at)
                      .map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => selectCompany(c)}
                        >
                          <CheckIcon
                            className={cn(
                              "mr-2 size-4",
                              selectedCompanyId === c.id
                                ? "opacity-100"
                                : "opacity-0"
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
                  {companySearch.trim() &&
                    companies.some(
                      (c) =>
                        !c.deleted_at &&
                        c.name
                          .toLowerCase()
                          .includes(companySearch.toLowerCase())
                    ) && (
                      <CommandGroup heading="Not what you're looking for?">
                        <CommandItem onSelect={createNewFromSearch}>
                          <PlusIcon className="mr-2 size-4 text-green-600" />
                          Create &ldquo;{companySearch.trim()}&rdquo;
                        </CommandItem>
                      </CommandGroup>
                    )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Email - full width, required */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          className="h-12 text-base"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@dispensary.com"
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Name - optional */}
      <div className="space-y-2">
        <label htmlFor="full_name" className="text-sm font-medium">
          Name{" "}
          <span className="text-muted-foreground font-normal">optional</span>
        </label>
        <Input
          id="full_name"
          className="h-12 text-base"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          disabled={isSubmitting}
        />
      </div>

      {/* Toggleable note */}
      {showNote ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="note" className="text-sm font-medium text-muted-foreground">
              Note
            </label>
            <button
              type="button"
              onClick={() => { setShowNote(false); setNote(""); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-3.5 inline mr-0.5" />
              Remove
            </button>
          </div>
          <textarea
            id="note"
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any notes about this person..."
            rows={2}
            disabled={isSubmitting}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <StickyNoteIcon className="size-3.5" />
          Add a note
        </button>
      )}

      {/* Send email + Submit in one row */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2">
          <Checkbox
            id="send-email"
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(checked === true)}
            disabled={isSubmitting}
          />
          <label
            htmlFor="send-email"
            className="text-sm cursor-pointer select-none text-muted-foreground"
          >
            Send login link
          </label>
        </div>
        <Button
          type="submit"
          className="h-12 px-8 text-base font-semibold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Adding..."
          ) : (
            <>
              <SendIcon className="mr-2 size-4" />
              Add
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
