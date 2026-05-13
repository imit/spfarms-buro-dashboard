import Link from "next/link";
import { MailIcon, InstagramIcon, ClockIcon, MapPinIcon } from "lucide-react";
import { MetaText, SectionLabel } from "@/components/public/style";
import { ContactForm } from "@/components/public/contact-form";

export const metadata = {
  title: "Contact — SPFarms Cannabis",
  description:
    "Get in touch with SPFarms. Questions, dispensary inquiries, press requests — we read every message.",
};

/**
 * /contact — public contact page.
 *
 * Two-up layout:
 *   Left  — short intro + brand-aligned contact "cards" (email, IG, response
 *           expectation, location) and a wholesale CTA at the bottom.
 *   Right — <ContactForm> which posts to /api/v1/public/support_tickets and
 *           creates a SupportTicket. Rate-limited server-side; honeypot on
 *           the form for extra spam friction.
 *
 * Visual language matches the rest of the marketing site — cream surfaces,
 * forest-deep ink, lime accents, font-mono caps labels via <MetaText>.
 */
export default function ContactPage() {
  return (
    <section className="px-4 py-12 md:px-8 md:py-20">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="mb-10 max-w-3xl md:mb-16">
          <SectionLabel className="font-mono text-xs text-sf-forest-deep">
            get in touch
          </SectionLabel>
          <h1 className="mt-2 text-[42px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep md:text-[56px]">
            Drop us a line.
            <br />
            <span className="italic">We&rsquo;re listening.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-sf-forest-deep/70 md:text-lg">
            Questions about a strain, a press request, a dispensary
            wanting to carry SPFarms — whatever it is, send it over. A real human
            on our team reads every message.
          </p>
        </div>

        {/* Two-up content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          {/* LEFT — brand-aligned info */}
          <div className="flex flex-col gap-3">
            <ContactCard
              icon={<MailIcon className="size-4" strokeWidth={2.25} />}
              label="Email us"
              value="info@spfarmsny.com"
              href="mailto:info@spfarmsny.com"
              accent="orange"
            />
            <ContactCard
              icon={<InstagramIcon className="size-4" strokeWidth={2.25} />}
              label="Instagram"
              value="@spfarmsny"
              href="https://instagram.com/spfarmsny"
              external
              accent="cream"
            />
            <ContactCard
              icon={<ClockIcon className="size-4" strokeWidth={2.25} />}
              label="Response time"
              value="1–2 business days"
              accent="cream"
            />
            <ContactCard
              icon={<MapPinIcon className="size-4" strokeWidth={2.25} />}
              label="Where we grow"
              value="Catskill Mountains · New York"
              accent="cream"
            />

            {/* Wholesale callout */}
            <div className="mt-2 rounded-[28px] bg-sf-lime p-6 md:p-7">
              <SectionLabel className="font-mono text-xs text-sf-forest-deep/70">
                For dispensaries
              </SectionLabel>
              <h3 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-sf-forest-deep">
                Want to carry SPFarms?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-sf-forest-deep/75">
                Skip the form — register your dispensary and we&rsquo;ll route you
                straight to wholesale.
              </p>
              <Link
                href="/wholesale/register"
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-sf-forest-deep px-4 py-2.5 text-sf-lime transition-colors hover:bg-sf-forest"
              >
                <MetaText size="xs" className="text-sf-lime">
                  Wholesale inquiry
                </MetaText>
              </Link>
            </div>
          </div>

          {/* RIGHT — the form */}
          <div className="relative">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  Contact "card" — one row of icon + tiny label + value                     */
/* -------------------------------------------------------------------------- */

function ContactCard({
  icon,
  label,
  value,
  href,
  external,
  accent = "cream",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
  accent?: "orange" | "cream";
}) {
  const surface =
    accent === "orange"
      ? "bg-sf-orange text-sf-cream"
      : "bg-sf-cream-soft text-sf-forest-deep";
  const iconBubble =
    accent === "orange"
      ? "bg-sf-cream/15 text-sf-cream"
      : "bg-sf-orange text-sf-cream";
  const labelColor =
    accent === "orange" ? "text-sf-cream/80" : "text-sf-forest-deep/55";
  const valueColor =
    accent === "orange" ? "text-sf-cream" : "text-sf-forest-deep";

  const inner = (
    <div className={`flex items-center gap-4 rounded-[20px] px-5 py-4 ${surface}`}>
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-full ${iconBubble}`}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <MetaText size="xs" className={`block ${labelColor}`}>
          {label}
        </MetaText>
        <p className={`mt-0.5 truncate text-base font-medium ${valueColor}`}>
          {value}
        </p>
      </div>
    </div>
  );

  if (!href) return inner;
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="block transition-transform hover:-translate-y-0.5"
      >
        {inner}
      </a>
    );
  }
  return (
    <a href={href} className="block transition-transform hover:-translate-y-0.5">
      {inner}
    </a>
  );
}
