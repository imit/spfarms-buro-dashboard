"use client";

import { useEffect, useState, useRef } from "react";
import { apiClient, type BulkFlowerSend, type Company } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ErrorAlert } from "@/components/ui/error-alert";
import {
  BuildingIcon,
  LeafIcon,
  MailIcon,
  SearchIcon,
  SendIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { showError } from "@/lib/errors";
import Link from "next/link";

type RecipientMode = "company" | "email";

export default function BulkFlowerPage() {
  const [sends, setSends] = useState<BulkFlowerSend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<RecipientMode>("company");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Company picker
  const [companySearch, setCompanySearch] = useState("");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout>>(null);

  // Email mode
  const [email, setEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");

  useEffect(() => {
    apiClient
      .getBulkFlowerSends()
      .then(setSends)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (mode !== "company") return;
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await apiClient.getCompanies({ q: companySearch || undefined, per_page: 10 });
        setCompanies(res.data);
      } catch {}
    }, 250);
  }, [companySearch, mode]);

  function openDialog() {
    setMode("company");
    setCustomMessage("");
    setSelectedCompany(null);
    setCompanySearch("");
    setEmail("");
    setRecipientName("");
    setDialogOpen(true);
  }

  async function handleSend() {
    if (mode === "company" && !selectedCompany) return;
    if (mode === "email" && !email.trim()) return;

    setIsSending(true);
    try {
      const record = await apiClient.createBulkFlowerSend({
        company_slug: mode === "company" ? selectedCompany!.slug : undefined,
        email: mode === "email" ? email.trim().toLowerCase() : undefined,
        recipient_name: mode === "email" ? recipientName.trim() || undefined : undefined,
        custom_message: customMessage.trim() || undefined,
      });
      setSends((prev) => [record, ...prev]);
      setDialogOpen(false);
      toast.success(`Bulk list sent to ${record.recipient_label}`);
    } catch (err) {
      showError("send the bulk list", err);
    } finally {
      setIsSending(false);
    }
  }

  const canSend =
    mode === "company" ? !!selectedCompany : !!email.trim();

  return (
    <div className="space-y-6 px-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <LeafIcon className="size-6 text-green-600" />
            Bulk Flower
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Send the current bulk availability list with PDF to companies or custom recipients.
          </p>
        </div>
        <Button onClick={openDialog}>
          <SendIcon className="mr-2 size-4" />
          Send Bulk List
        </Button>
      </div>

      {/* Send history */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Send History</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : sends.length === 0 ? (
          <div className="rounded-lg border bg-card p-10 text-center">
            <LeafIcon className="mx-auto size-8 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">No bulk list emails sent yet.</p>
            <Button className="mt-4" onClick={openDialog}>
              <SendIcon className="mr-2 size-4" />
              Send your first bulk list
            </Button>
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Recipient</th>
                  <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Message</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Products</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Sent by</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {sends.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {s.company_slug ? (
                          <BuildingIcon className="size-3.5 text-muted-foreground shrink-0" />
                        ) : (
                          <UserIcon className="size-3.5 text-muted-foreground shrink-0" />
                        )}
                        <div>
                          {s.company_slug ? (
                            <Link
                              href={`/admin/companies/${s.company_slug}`}
                              className="font-medium hover:underline"
                            >
                              {s.recipient_label}
                            </Link>
                          ) : (
                            <span className="font-medium">{s.recipient_label}</span>
                          )}
                          {s.email && !s.company_slug && (
                            <div className="text-xs text-muted-foreground">{s.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell max-w-xs">
                      {s.custom_message ? (
                        <span className="truncate block max-w-[200px]" title={s.custom_message}>
                          {s.custom_message}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {s.product_count != null ? (
                        <Badge variant="secondary">{s.product_count} product{s.product_count !== 1 ? "s" : ""}</Badge>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {s.sent_by?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground whitespace-nowrap">
                      {new Date(s.sent_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Bulk Flower List</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Mode toggle */}
            <div className="flex rounded-lg border p-1 gap-1">
              <button
                type="button"
                onClick={() => setMode("company")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === "company" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BuildingIcon className="size-3.5" />
                Existing Company
              </button>
              <button
                type="button"
                onClick={() => setMode("email")}
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  mode === "email" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MailIcon className="size-3.5" />
                Custom Email
              </button>
            </div>

            {mode === "company" ? (
              <Field>
                <FieldLabel>Company</FieldLabel>
                <div className="relative">
                  {selectedCompany ? (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div>
                        <span className="font-medium">{selectedCompany.name}</span>
                        {!selectedCompany.bulk_buyer && (
                          <Badge variant="outline" className="ml-2 text-xs text-amber-600">Not a bulk buyer</Badge>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedCompany(null); setCompanySearch(""); }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        className="pl-9"
                        placeholder="Search companies..."
                        value={companySearch}
                        onChange={(e) => { setCompanySearch(e.target.value); setCompanyDropdownOpen(true); }}
                        onFocus={() => setCompanyDropdownOpen(true)}
                      />
                      {companyDropdownOpen && companies.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
                          {companies.map((c) => (
                            <button
                              key={c.slug}
                              type="button"
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted"
                              onClick={() => { setSelectedCompany(c); setCompanyDropdownOpen(false); }}
                            >
                              <BuildingIcon className="size-3.5 text-muted-foreground shrink-0" />
                              <span>{c.name}</span>
                              {c.bulk_buyer && <Badge variant="secondary" className="ml-auto text-xs">Bulk</Badge>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Field>
            ) : (
              <>
                <Field>
                  <FieldLabel>Email address *</FieldLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="buyer@dispensary.com"
                  />
                </Field>
                <Field>
                  <FieldLabel>Name <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
                  <Input
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Green Dispensary"
                  />
                </Field>
              </>
            )}

            <Field>
              <FieldLabel>Custom message <span className="text-muted-foreground font-normal">(optional)</span></FieldLabel>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a personal note to include in the email..."
                rows={3}
              />
            </Field>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSend} disabled={isSending || !canSend}>
              <SendIcon className="mr-2 size-4" />
              {isSending ? "Sending..." : "Send Bulk List"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
