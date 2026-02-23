"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  apiClient,
  type User,
  type Company,
  type SampleInventoryRow,
} from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ErrorAlert } from "@/components/ui/error-alert";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

interface InventorySelection extends SampleInventoryRow {
  quantity: number;
}

export default function GiveSamplesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [inventory, setInventory] = useState<InventorySelection[]>([]);
  const [receiverId, setReceiverId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [markAsDropped, setMarkAsDropped] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (!isAuthenticated) return;

    Promise.all([
      apiClient.getUsers(),
      apiClient.getCompanies(),
      apiClient.getSampleInventory(),
    ])
      .then(([u, c, inv]) => {
        setUsers(u.filter((user) => !user.deleted_at));
        setCompanies(c);
        setInventory(inv.map((row) => ({ ...row, quantity: 0 })));
      })
      .catch(() => {});
  }, [isAuthenticated]);

  function updateQuantity(index: number, value: number) {
    setInventory((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              quantity: Math.max(0, Math.min(value, row.available_count)),
            }
          : row
      )
    );
  }

  const totalSelected = inventory.reduce((s, r) => s + r.quantity, 0);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!receiverId) {
      setError("Please select a receiver.");
      return;
    }

    const selections = inventory
      .filter((r) => r.quantity > 0)
      .map((r) => ({
        strain_id: r.strain_id,
        weight: r.weight,
        quantity: r.quantity,
      }));

    if (selections.length === 0) {
      setError("Select at least one sample to give.");
      return;
    }

    setIsSubmitting(true);

    try {
      const handoff = await apiClient.createSampleHandoff({
        receiver_id: Number(receiverId),
        company_id: companyId ? Number(companyId) : undefined,
        mark_as_dropped: markAsDropped,
        notes: notes || undefined,
        selections,
      });

      router.push(`/admin/samples/handoffs/${handoff.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "We couldn't create handoff"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (authLoading || !isAuthenticated) return null;

  return (
    <div className="max-w-3xl space-y-6 px-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/samples">
            <ArrowLeftIcon className="size-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl font-semibold">Give Samples</h2>
          <p className="text-sm text-muted-foreground">
            Hand off samples from available inventory
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && <ErrorAlert message={error} />}

        <FieldGroup>
          <Field>
            <FieldLabel>Receiver *</FieldLabel>
            <Select value={receiverId} onValueChange={setReceiverId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select who receives the samples..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.full_name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel>Target Company (optional)</FieldLabel>
            <Select value={companyId} onValueChange={setCompanyId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No company selected" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
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
              placeholder="Optional notes..."
              rows={2}
              disabled={isSubmitting}
            />
          </Field>

          <div className="flex items-center gap-2">
            <Checkbox
              id="mark_as_dropped"
              checked={markAsDropped}
              onCheckedChange={(checked) => setMarkAsDropped(checked === true)}
              disabled={isSubmitting}
            />
            <label
              htmlFor="mark_as_dropped"
              className="text-sm font-medium cursor-pointer"
            >
              Mark as dropped (skip separate drop confirmation)
            </label>
          </div>
        </FieldGroup>

        {/* Available Stock */}
        <section className="space-y-3">
          <h3 className="text-lg font-medium">Available Stock</h3>
          {inventory.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No prepared samples available. Prepare some first.
            </p>
          ) : (
            <div className="rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Strain</th>
                    <th className="px-4 py-3 text-left font-medium">Weight</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Available
                    </th>
                    <th className="px-4 py-3 text-right font-medium w-32">
                      Give
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.map((row, index) => (
                    <tr
                      key={`${row.strain_id}-${row.weight}`}
                      className="border-b last:border-0"
                    >
                      <td className="px-4 py-3 font-medium">
                        {row.strain_name}
                        {row.strain_category && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({row.strain_category})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.weight}g
                      </td>
                      <td className="px-4 py-3 text-right">
                        {row.available_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Input
                          type="number"
                          min={0}
                          max={row.available_count}
                          value={row.quantity}
                          onChange={(e) =>
                            updateQuantity(
                              index,
                              parseInt(e.target.value) || 0
                            )
                          }
                          disabled={isSubmitting}
                          className="w-20 ml-auto text-right"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {totalSelected > 0 && (
          <div className="rounded-md border bg-muted/50 px-4 py-3 text-sm">
            <p>
              <span className="text-muted-foreground">Total samples:</span>{" "}
              <strong>{totalSelected}</strong>
            </p>
            <p>
              <span className="text-muted-foreground">Total weight:</span>{" "}
              {inventory
                .reduce((s, r) => s + r.quantity * r.weight, 0)
                .toFixed(1)}
              g
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || totalSelected === 0}
          >
            {isSubmitting
              ? "Saving..."
              : markAsDropped
                ? "Give & Drop"
                : "Give Samples"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/samples")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
