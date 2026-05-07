"use client";

import Link from "next/link";
import {
  BadgeCheckIcon,
  CheckIcon,
  CircleIcon,
  PackageCheckIcon,
  ShoppingCartIcon,
} from "lucide-react";
import type { Cart, Company } from "@/lib/api";
import { cn } from "@/lib/utils";

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

  if (hasOrderHistory) return null;
  if (setupComplete && hasCartItems) return null;

  // Soft progression — no format gate.
  const step1Done = setupComplete;
  const step2Done = hasCartItems;
  const step3Done = false;

  return (
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
        description="Metrc, manifest, and delivery — typically 2–3 days."
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
        "group relative flex flex-col rounded-xl border bg-card p-5 shadow-sm transition-shadow",
        "hover:shadow-md",
        done && "border-emerald-300/70"
      )}
    >
      {/* Header: icon tile + step indicator */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-lg",
            done ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
          )}
          aria-hidden="true"
        >
          <Icon className="size-6" strokeWidth={1.75} />
        </div>
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
            done
              ? "bg-emerald-500 text-white"
              : "bg-muted text-muted-foreground/80"
          )}
          aria-label={done ? "Complete" : `Step ${number}`}
        >
          {done ? <CheckIcon className="size-4" strokeWidth={3} /> : number}
        </div>
      </div>

      {/* Title + description */}
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
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
