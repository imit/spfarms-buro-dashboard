"use client";

import type { PaymentTerm } from "@/lib/api";

interface CodPromoBannerProps {
  paymentTerms: PaymentTerm[] | undefined;
  disabled?: boolean;
  bulkPhone?: string;
}

/**
 * Picks the most attractive "cash on delivery" term — active, due immediately
 * (days === 0) and offering the largest discount. Returns null if no such term
 * exists (or all such terms have a 0% discount).
 */
function pickCodTerm(terms: PaymentTerm[] | undefined): PaymentTerm | null {
  if (!terms || terms.length === 0) return null;
  const candidates = terms
    .filter((t) => t.active && t.days === 0 && parseFloat(t.discount_percentage) > 0)
    .sort(
      (a, b) => parseFloat(b.discount_percentage) - parseFloat(a.discount_percentage),
    );
  return candidates[0] ?? null;
}

export function CodPromoBanner({ paymentTerms, disabled, bulkPhone }: CodPromoBannerProps) {
  // The COD section is gated by the menu's discount setting; the "call Henry"
  // line is contact info and shows independently.
  const cod = disabled ? null : pickCodTerm(paymentTerms);
  const phone = bulkPhone?.trim() || "";

  // Nothing to show — render nothing rather than an empty yellow block.
  if (!cod && !phone) return null;

  const pct = cod ? parseFloat(cod.discount_percentage) : 0;
  const pctLabel = cod ? `${Number.isInteger(pct) ? pct.toFixed(0) : pct}%` : "";

  return (
    <div className="mb-8 rounded-2xl bg-[#FAEA65] px-6 py-5 shadow-sm md:px-8 md:py-6">
      <div className="flex items-center gap-4 md:gap-5">
        <img
          src="/panda-symbol.svg"
          alt=""
          aria-hidden
          className="shrink-0 size-12 md:size-14 object-contain"
        />

        <div className="min-w-0 flex-1 space-y-2">
          {cod && (
            <div>
              <h3 className="text-lg md:text-xl font-bold tracking-tight text-neutral-900">
                Save {pctLabel} when you pay cash on delivery
              </h3>
              <p className="mt-0.5 text-sm md:text-base text-neutral-800/80">
                Select <span className="font-semibold text-neutral-900">{cod.name}</span>{" "}
                at checkout to apply the discount.
              </p>
            </div>
          )}

          {phone && (
            <p
              className={
                cod
                  ? "border-t border-neutral-900/10 pt-2 text-sm md:text-base text-neutral-800/90"
                  : "text-base md:text-lg font-medium text-neutral-900"
              }
            >
              For special pricing call Henry:{" "}
              <a
                href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                className="font-bold text-neutral-900 underline underline-offset-4"
              >
                {phone}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
