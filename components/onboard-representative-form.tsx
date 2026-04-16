"use client";

import { useState, useEffect, useRef, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiClient, type Company } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2Icon,
  XIcon,
  PlusIcon,
  SendIcon,
  StickyNoteIcon,
  SearchIcon,
  UsersIcon,
  MailIcon,
  LoaderIcon,
  CheckIcon,
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    null
  );
  const [newCompanyName, setNewCompanyName] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [sendEmail, setSendEmail] = useState(true);
  const [resending, setResending] = useState<number | null>(null);
  const [resent, setResent] = useState<Set<number>>(new Set());

  async function handleResend(memberId: number) {
    setResending(memberId);
    try {
      await apiClient.sendWelcomeEmail(memberId);
      setResent((prev) => new Set(prev).add(memberId));
    } catch {
      // silent fail — button stays available to retry
    } finally {
      setResending(null);
    }
  }

  useEffect(() => {
    apiClient
      .getCompanies({ per_page: 100 })
      .then((res) => setCompanies(res.data))
      .catch(() => {});
  }, []);

  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);
  const isNewCompany = !!newCompanyName && !selectedCompanyId;

  // Filter companies for search results
  const filteredCompanies = companies.filter(
    (c) =>
      !c.deleted_at &&
      c.name.toLowerCase().includes(companySearch.toLowerCase())
  );
  const showResults = searchFocused && companySearch.trim().length > 0;
  const hasExactMatch = filteredCompanies.some(
    (c) => c.name.toLowerCase() === companySearch.toLowerCase()
  );

  // Duplicate email check
  const duplicateMember = selectedCompany?.members.find(
    (m) => email.trim() && m.email.toLowerCase() === email.trim().toLowerCase()
  ) ?? null;

  function selectCompany(company: Company) {
    setSelectedCompanyId(company.id);
    setSelectedCompany(null);
    setNewCompanyName("");
    setCompanySearch("");
    setSearchFocused(false);

    // Fetch full company with members
    setLoadingCompany(true);
    apiClient
      .getCompany(company.slug)
      .then((full) => {
        setSelectedCompany(full);
      })
      .catch(() => {
        // Fallback to list version if fetch fails
        setSelectedCompany(company);
      })
      .finally(() => {
        setLoadingCompany(false);
      });
  }

  function createNewFromSearch() {
    setNewCompanyName(companySearch.trim());
    setSelectedCompanyId(null);
    setCompanySearch("");
    setSearchFocused(false);
  }

  function clearCompany() {
    setSelectedCompanyId(null);
    setSelectedCompany(null);
    setNewCompanyName("");
    setCompanySearch("");
    setResent(new Set());
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
    if (duplicateMember) {
      setError("This email is already a member of this company. Use the resend button instead.");
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
        <label className="text-base font-medium">Company</label>

        {isNewCompany ? (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Input
                className="h-14 text-lg rounded-xl flex-1"
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
        ) : selectedCompanyId ? (
          <div className="space-y-2">
            {/* Company name chip */}
            <div className="flex items-center gap-3 rounded-xl border bg-muted/50 px-5 py-4">
              <div className="flex-1 min-w-0">
                {selectedCompany ? (
                  <>
                    <p className="text-lg font-medium truncate">
                      {selectedCompany.name}
                    </p>
                    {selectedCompany.locations[0]?.city && (
                      <p className="text-sm text-muted-foreground truncate">
                        {selectedCompany.locations[0].city},{" "}
                        {selectedCompany.locations[0].state}
                      </p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
                    <p className="text-base text-muted-foreground">Loading...</p>
                  </div>
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

            {/* Members section — always visible when company is loaded */}
            {loadingCompany ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2.5">
                <LoaderIcon className="size-3 animate-spin text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Loading members...</p>
              </div>
            ) : selectedCompany ? (
              selectedCompany.members.length > 0 ? (
                <div className="rounded-md border px-4 py-3 space-y-3">
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <UsersIcon className="size-4" />
                    {selectedCompany.members.length} existing{" "}
                    {selectedCompany.members.length === 1 ? "member" : "members"}
                  </p>
                  <div className="space-y-2">
                    {selectedCompany.members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3">
                        <p className="text-sm text-muted-foreground truncate min-w-0">
                          {m.full_name ? (
                            <>
                              <span className="text-foreground font-medium">{m.full_name}</span>{" "}
                              <span className="opacity-60">{m.email}</span>
                            </>
                          ) : (
                            m.email
                          )}
                        </p>
                        <button
                          type="button"
                          disabled={resending === m.id}
                          onClick={() => handleResend(m.id)}
                          className={cn(
                            "shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                            resent.has(m.id)
                              ? "text-green-600 bg-green-50"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}
                        >
                          {resending === m.id ? (
                            <><LoaderIcon className="size-3.5 animate-spin" /> Sending</>
                          ) : resent.has(m.id) ? (
                            <><CheckIcon className="size-3.5" /> Sent</>
                          ) : (
                            <><MailIcon className="size-3.5" /> Resend</>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground px-1">No members yet</p>
              )
            ) : null}
          </div>
        ) : (
          /* Inline search — no popover */
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              className="flex h-14 w-full rounded-xl border bg-transparent px-4 pl-11 text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                // Small delay so clicks on results register
                setTimeout(() => setSearchFocused(false), 200);
              }}
              placeholder="Search or create..."
              disabled={isSubmitting}
            />
            {/* Inline results list */}
            {showResults && (
              <div className="mt-1.5 rounded-xl border bg-popover shadow-md overflow-hidden">
                {filteredCompanies.length > 0 && (
                  <ul className="max-h-64 overflow-y-auto divide-y">
                    {filteredCompanies.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-accent transition-colors active:bg-accent"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectCompany(c)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium truncate">{c.name}</p>
                            {c.locations[0]?.city && (
                              <p className="text-sm text-muted-foreground">
                                {c.locations[0].city}, {c.locations[0].state}
                              </p>
                            )}
                          </div>
                          {c.members_count > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0 bg-muted rounded-full px-2.5 py-1">
                              {c.members_count}{" "}
                              {c.members_count === 1 ? "member" : "members"}
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {/* Create new option */}
                {companySearch.trim() && !hasExactMatch && (
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-4 text-base font-semibold bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-100 transition-colors dark:bg-green-950/30 dark:text-green-400 dark:hover:bg-green-950/50",
                      filteredCompanies.length > 0 && "border-t"
                    )}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={createNewFromSearch}
                  >
                    <PlusIcon className="size-5 shrink-0" />
                    Create &ldquo;{companySearch.trim()}&rdquo;
                  </button>
                )}
                {filteredCompanies.length === 0 &&
                  !companySearch.trim() && (
                    <p className="px-4 py-3.5 text-base text-muted-foreground">
                      Start typing...
                    </p>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Email - full width, required */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-base font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          className={cn(
            "h-14 text-lg rounded-xl",
            duplicateMember && "border-amber-500 focus-visible:ring-amber-500"
          )}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@dispensary.com"
          required
          disabled={isSubmitting}
        />
        {duplicateMember && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3">
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Already a member
              {duplicateMember.full_name ? ` (${duplicateMember.full_name})` : ""}
            </p>
            <button
              type="button"
              disabled={resending === duplicateMember.id}
              onClick={() => handleResend(duplicateMember.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                resent.has(duplicateMember.id)
                  ? "text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                  : "text-amber-700 bg-amber-100 hover:bg-amber-200 dark:text-amber-300 dark:bg-amber-900/40 dark:hover:bg-amber-900/60"
              )}
            >
              {resending === duplicateMember.id ? (
                <><LoaderIcon className="size-4 animate-spin" /> Sending...</>
              ) : resent.has(duplicateMember.id) ? (
                <><CheckIcon className="size-4" /> Invitation sent</>
              ) : (
                <><MailIcon className="size-4" /> Resend invitation</>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Name - optional */}
      <div className="space-y-2">
        <label htmlFor="full_name" className="text-base font-medium">
          Name{" "}
          <span className="text-muted-foreground font-normal text-sm">optional</span>
        </label>
        <Input
          id="full_name"
          className="h-14 text-lg rounded-xl"
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
            <label
              htmlFor="note"
              className="text-base font-medium text-muted-foreground"
            >
              Note
            </label>
            <button
              type="button"
              onClick={() => {
                setShowNote(false);
                setNote("");
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              <XIcon className="size-4 inline mr-0.5" />
              Remove
            </button>
          </div>
          <textarea
            id="note"
            className="w-full rounded-xl border bg-transparent px-4 py-3 text-base placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          <StickyNoteIcon className="size-4" />
          Add a note
        </button>
      )}

      {/* Send email + Submit in one row */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <div className="flex items-center gap-2.5">
          <Checkbox
            id="send-email"
            className="size-5"
            checked={sendEmail}
            onCheckedChange={(checked) => setSendEmail(checked === true)}
            disabled={isSubmitting}
          />
          <label
            htmlFor="send-email"
            className="text-base cursor-pointer select-none text-muted-foreground"
          >
            Send login link
          </label>
        </div>
        <Button
          type="submit"
          className="h-14 px-10 text-lg font-semibold rounded-xl"
          disabled={isSubmitting || !!duplicateMember}
        >
          {isSubmitting ? (
            "Adding..."
          ) : (
            <>
              <SendIcon className="mr-2 size-5" />
              Add
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
