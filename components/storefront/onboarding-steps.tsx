"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BadgeCheckIcon,
  BuildingIcon,
  CheckIcon,
  CircleIcon,
  PackageCheckIcon,
  ShoppingCartIcon,
  XIcon,
} from "lucide-react";
import type { Cart, Company } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

const SWITCHER_TIP_DISMISSED_KEY = "sf_switcher_tip_dismissed";

interface OnboardingStepsProps {
  slug: string;
  company: Company;
  cart: Cart | null;
}

/**
 * Three-step "how it works" preview for new dispensaries on the storefront.
 *
 * Intentionally light-touch: the SPFarms team handles dispensary verification
 * on the admin side, so missing license/address is a *gentle nudge*, never a
 * wall. Step 1 is considered "done" when license and address are *present*
 * (regardless of format). License format hints live only in settings.
 *
 * Visibility:
 *   - Hidden once the company has placed at least one order.
 *   - Hidden once setup is complete AND the cart has items.
 */
export function StorefrontOnboarding({ slug, company, cart }: OnboardingStepsProps) {
  const hasLicense = !!company.license_number?.trim();
  const hasLocation = company.locations.length > 0;
  const setupComplete = hasLicense && hasLocation;

  const cartItemCount = cart?.items?.length ?? 0;
  const hasCartItems = cartItemCount > 0;

  const hasOrderHistory = (company.orders_count ?? 0) > 0;

  // Soft progression — no format gate.
  const step1Done = setupComplete;
  const step2Done = hasCartItems;
  const step3Done = false;

  // The "how it works" steps disappear once the dispensary is up & running,
  // but the multi-dispensary tip should still show for users who haven't
  // dismissed it — even on a fully onboarded company.
  const hideSteps = hasOrderHistory || (setupComplete && hasCartItems);

  return (
    <>
      <MultiDispensaryTip />
      {hideSteps ? null : (
        <ol
          aria-label="How it works"
          className="mb-10 grid gap-4 md:grid-cols-3"
        >
          <Step
            number={1}
            done={step1Done}
            icon={BadgeCheckIcon}
            title="Get on the list"
            description="License and delivery address. We&rsquo;ll confirm on our end."
          >
            <Checklist>
              <ChecklistRow done={hasLicense}>
                {hasLicense ? (
                  <span className="font-mono">{company.license_number}</span>
                ) : (
                  <Link
                    href={`/${slug}/settings/company`}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Add OCM license →
                  </Link>
                )}
              </ChecklistRow>
              <ChecklistRow done={hasLocation}>
                {hasLocation ? (
                  <span className="text-muted-foreground">
                    {formatLocation(company)}
                  </span>
                ) : (
                  <Link
                    href={`/${slug}/settings/company`}
                    className="font-medium text-primary underline underline-offset-4"
                  >
                    Add delivery address →
                  </Link>
                )}
              </ChecklistRow>
            </Checklist>
          </Step>

          <Step
            number={2}
            done={step2Done}
            icon={ShoppingCartIcon}
            title="Pick what you want"
            description="Browse strains, add to cart. Saves as you go."
          >
            {hasCartItems ? (
              <p className="text-sm">
                <span className="font-mono font-medium">{cartItemCount}</span>{" "}
                {cartItemCount === 1 ? "item" : "items"} in cart ·{" "}
                <Link
                  href={`/${slug}/cart`}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  Review →
                </Link>
              </p>
            ) : setupComplete ? (
              <p className="text-sm text-muted-foreground">
                Menu is right below.
              </p>
            ) : null}
          </Step>

          <Step
            number={3}
            done={step3Done}
            icon={PackageCheckIcon}
            title="We deliver"
            description="Metrc, manifest, and delivery!"
          >
            {hasCartItems ? (
              <Link
                href={`/${slug}/checkout`}
                className="inline-flex items-center text-sm font-medium text-primary underline underline-offset-4"
              >
                Place your order →
              </Link>
            ) : null}
          </Step>
        </ol>
      )}
    </>
  );
}

/**
 * Single-line tip for users who belong to multiple dispensaries, pointing them
 * at the company switcher in the header. Renders nothing for single-membership
 * users. Permanent dismissal via localStorage — once they "get it," they get it.
 */
function MultiDispensaryTip() {
  const { user } = useAuth();
  // `null` = unknown (SSR / pre-mount), avoids a flash before we read storage.
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(SWITCHER_TIP_DISMISSED_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  const count = user?.companies?.length ?? 0;
  if (count <= 1) return null;
  if (dismissed !== false) return null;

  function dismiss() {
    try {
      localStorage.setItem(SWITCHER_TIP_DISMISSED_KEY, "1");
    } catch {
      // no-op — banner reappears next visit, which is fine
    }
    setDismissed(true);
  }

  return (
    <div className="mb-6 flex items-start gap-3 rounded-lg border bg-muted/40 px-4 py-3 text-sm">
      <BuildingIcon
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <p className="flex-1 leading-snug text-muted-foreground">
        Member of <span className="font-medium text-foreground">{count} dispensaries</span> —
        switch from the dropdown by the logo. Each has its own cart and orders.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground"
      >
        <XIcon className="size-4" />
      </button>
    </div>
  );
}

function Step({
  number,
  done,
  icon: Icon,
  title,
  description,
  children,
}: {
  number: number;
  done: boolean;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <li
      className={cn(
        "relative flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 transition-colors",
        done && "border-emerald-200 bg-emerald-50/40"
      )}
    >
      {/* Header: icon + step label */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg",
            done ? "bg-emerald-100 text-emerald-700" : "bg-neutral-100 text-neutral-700"
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" strokeWidth={1.75} />
        </div>
        <span
          className={cn(
            "text-[11px] font-bold uppercase tabular-nums tracking-[0.2em]",
            done ? "text-emerald-600" : "text-neutral-400"
          )}
          aria-label={done ? "Complete" : `Step ${number}`}
        >
          {done ? (
            <CheckIcon className="size-4" strokeWidth={3} aria-hidden="true" />
          ) : (
            `0${number}`
          )}
        </span>
      </div>

      {/* Title + description */}
      <h3 className="text-base font-semibold tracking-tight text-neutral-900">
        {title}
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>

      {/* Sub-content */}
      {children && <div className="mt-4">{children}</div>}
    </li>
  );
}

function Checklist({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 text-sm">{children}</div>;
}

function ChecklistRow({
  done,
  children,
}: {
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        {done ? (
          <CheckIcon
            className="size-4 text-emerald-600"
            strokeWidth={3}
          />
        ) : (
          <CircleIcon
            className="size-4 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        )}
      </span>
      <span className={cn("leading-snug", done && "text-foreground")}>
        {children}
      </span>
    </div>
  );
}

function formatLocation(company: Company): string {
  const loc = company.locations[0];
  if (!loc) return "";
  return [loc.address, loc.city, loc.state].filter(Boolean).join(", ");
}
