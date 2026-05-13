"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { apiClient } from "@/lib/api";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { MetaText, SectionLabel } from "@/components/public/style";
import { cn } from "@/lib/utils";
import { ArrowLeftIcon, CheckIcon } from "lucide-react";

/**
 * Wholesale partnership signup — minimal version.
 *
 * Layout:
 *   1. PublicHeader (cream nav)
 *   2. Slim hero with eyebrow + italic-emphasis headline + intro
 *   3. Three plain form sections, separated by hairline rules
 *      — no cards, no icons, no numbered eyebrows
 *   4. Single submit button (full-width on mobile, right-aligned on desktop)
 *   5. PublicFooter
 */
export default function WholesaleRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_website: "",
    license_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_title: "",
  });

  // Funnel tracking. We fire `wholesale_register_viewed` once on mount
  // and `wholesale_register_started` the first time the visitor touches
  // any field — this distinguishes "QR scanners who bounced before
  // typing" from "QR scanners who got into the form but didn't submit."
  const viewedRef = useRef(false);
  const startedRef = useRef(false);
  const formStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (viewedRef.current) return;
    viewedRef.current = true;
    posthog.capture("wholesale_register_viewed");
  }, []);

  const update = (field: string, value: string) => {
    if (!startedRef.current && value.length > 0) {
      startedRef.current = true;
      formStartTime.current = Date.now();
      posthog.capture("wholesale_register_started", { first_field: field });
    }
    setForm((f) => ({ ...f, [field]: value }));
  };

  /** Field-count + has_* flags for analytics. Never sends raw values. */
  function formMetrics() {
    const entries = Object.entries(form);
    const filled = entries.filter(([, v]) => v.trim().length > 0).map(([k]) => k);
    return {
      fields_filled_count: filled.length,
      has_company_email: !!form.company_email,
      has_company_phone: !!form.company_phone,
      has_company_website: !!form.company_website,
      has_license_number: !!form.license_number,
      has_address: !!form.address,
      has_contact_title: !!form.contact_title,
      time_to_submit_ms:
        formStartTime.current != null ? Date.now() - formStartTime.current : null,
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const metrics = formMetrics();
    posthog.capture("wholesale_register_submitted", metrics);

    try {
      await apiClient.registerPartnership({
        company: {
          name: form.company_name,
          email: form.company_email || undefined,
          phone_number: form.company_phone || undefined,
          website: form.company_website || undefined,
          license_number: form.license_number || undefined,
        },
        location: form.address
          ? {
              address: form.address,
              city: form.city || undefined,
              state: form.state || undefined,
              zip_code: form.zip_code || undefined,
            }
          : undefined,
        contact: {
          full_name: form.contact_name,
          email: form.contact_email,
          phone_number: form.contact_phone || undefined,
          title: form.contact_title || undefined,
        },
      });
      posthog.capture("wholesale_register_succeeded", metrics);
      setIsSuccess(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed. Please try again.";
      posthog.capture("wholesale_register_failed", { ...metrics, error: message });
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ─── Success state ──────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-sf-cream text-sf-forest-deep">
        <PublicHeader />
        <main className="flex-1 px-4 py-16 md:px-8 md:py-24">
          <div className="mx-auto max-w-[560px] text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sf-lime">
              <CheckIcon className="size-6 text-sf-forest-deep" strokeWidth={2.5} />
            </div>
            <h1 className="mt-8 text-[34px] font-bold leading-[1.1] tracking-tight md:text-[42px]">
              Thanks for{" "}
              <span className="italic font-bold">reaching out.</span>
            </h1>
            <p className="mt-4 text-base text-sf-forest-deep/70">
              We&apos;ll review your application and get back to you within
              1–2 business days.
            </p>
            <button
              type="button"
              onClick={() => router.push("/wholesale")}
              className="mt-10 inline-flex h-10 items-center gap-2 rounded-md bg-sf-ink px-4 text-sf-cream transition-colors hover:bg-sf-forest-deep"
            >
              <ArrowLeftIcon className="size-4" strokeWidth={2.25} />
              <MetaText size="sm" className="text-sf-cream">
                Back to Wholesale
              </MetaText>
            </button>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  // ─── Form state ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-sf-cream text-sf-forest-deep">
      <PublicHeader />

      <main className="flex-1 px-4 md:px-8">
        <div className="mx-auto max-w-[680px] py-12 md:py-20">
          {/* ── Heading ─────────────────────────────────────────────── */}
          <div>
            <SectionLabel>let&apos;s be partners</SectionLabel>
            <h1 className="mt-4 text-[36px] font-bold leading-[1.05] tracking-tight md:text-[52px]">
              Become a{" "}
              <span className="italic font-bold">wholesale</span> partner.
            </h1>
            <p className="mt-5 max-w-lg text-base text-sf-forest-deep/70 md:text-lg">
              Tell us about your dispensary. We&apos;ll review and reach out
              within 1–2 business days.
            </p>
          </div>

          {/* ── Form ────────────────────────────────────────────────── */}
          <form onSubmit={handleSubmit} className="mt-12 md:mt-16">
            <FormSection title="Company">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  id="company_name"
                  label="Company name"
                  required
                  value={form.company_name}
                  onChange={(v) => update("company_name", v)}
                />
                <Field
                  id="company_email"
                  label="Company email"
                  type="email"
                  value={form.company_email}
                  onChange={(v) => update("company_email", v)}
                />
                <Field
                  id="company_phone"
                  label="Company phone"
                  value={form.company_phone}
                  onChange={(v) => update("company_phone", v)}
                />
                <Field
                  id="company_website"
                  label="Website"
                  value={form.company_website}
                  onChange={(v) => update("company_website", v)}
                  placeholder="https://"
                />
                <Field
                  id="license_number"
                  label="License number"
                  value={form.license_number}
                  onChange={(v) => update("license_number", v)}
                  placeholder="OCM-XXXXX"
                />
              </div>
            </FormSection>

            <FormSection title="Location">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  className="sm:col-span-2"
                  id="address"
                  label="Street address"
                  value={form.address}
                  onChange={(v) => update("address", v)}
                />
                <Field
                  id="city"
                  label="City"
                  value={form.city}
                  onChange={(v) => update("city", v)}
                />
                <div className="grid grid-cols-[1fr_1fr] gap-4">
                  <Field
                    id="state"
                    label="State"
                    value={form.state}
                    onChange={(v) => update("state", v)}
                  />
                  <Field
                    id="zip_code"
                    label="ZIP"
                    value={form.zip_code}
                    onChange={(v) => update("zip_code", v)}
                  />
                </div>
              </div>
            </FormSection>

            <FormSection title="Contact">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="contact_name"
                  label="Full name"
                  required
                  value={form.contact_name}
                  onChange={(v) => update("contact_name", v)}
                />
                <Field
                  id="contact_title"
                  label="Title"
                  value={form.contact_title}
                  onChange={(v) => update("contact_title", v)}
                  placeholder="e.g. Owner, Manager"
                />
                <Field
                  id="contact_email"
                  label="Email"
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(v) => update("contact_email", v)}
                />
                <Field
                  id="contact_phone"
                  label="Phone"
                  value={form.contact_phone}
                  onChange={(v) => update("contact_phone", v)}
                />
              </div>
            </FormSection>

            {error && (
              <div
                role="alert"
                className="mt-8 rounded-md border border-sf-orange/30 bg-sf-orange/10 px-4 py-3 text-sm text-sf-orange-deep"
              >
                {error}
              </div>
            )}

            {/* ── Submit ─────────────────────────────────────────── */}
            <div className="mt-12 flex flex-col-reverse items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/wholesale"
                className="inline-flex items-center justify-center text-sm text-sf-forest-deep/60 transition-colors hover:text-sf-forest-deep"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-12 items-center justify-center rounded-md bg-sf-ink px-8 text-sf-cream transition-colors hover:bg-sf-forest-deep disabled:opacity-60"
              >
                <MetaText size="sm" className="text-sf-cream">
                  {isSubmitting ? "Submitting…" : "Submit application"}
                </MetaText>
              </button>
            </div>

            <p className="mt-4 text-xs text-sf-forest-deep/50">
              <span aria-hidden="true">*</span> Required: company name, your name,
              and email. Everything else helps us route your application faster.
            </p>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

// ─── Local primitives ─────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-sf-cream-deep py-8 first:border-t-0 first:pt-0 md:py-10 md:first:pt-0">
      <h2 className="mb-6 text-lg font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  id,
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  className,
}: {
  id: string;
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-sf-forest-deep"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-sf-orange">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-md border border-sf-cream-deep bg-white px-3 text-base text-sf-forest-deep",
          "placeholder:text-sf-forest-deep/35",
          "transition-colors outline-none",
          "focus:border-sf-forest focus:ring-2 focus:ring-sf-forest/15",
        )}
      />
    </div>
  );
}
