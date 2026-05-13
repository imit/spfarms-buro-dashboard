"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { MetaText } from "./style";
import { apiClient } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Public contact form — posts to /api/v1/public/support_tickets, which
 * creates a SupportTicket (anonymous, no user) and notifies info@spfarmsny.com.
 *
 * Abuse controls:
 *   • Server-side honeypot — we render an off-screen `website` field that
 *     bots typically autofill. If it comes back non-empty the API silently
 *     pretends to accept the submission.
 *   • Server-side rate limiter (Rails 8 `rate_limit` macro):
 *       - 3 / hour per remote IP
 *       - 2 / 10 min per submitted email
 *     A 429 response is surfaced here as a normal error message.
 *
 * Styling matches the rest of the public site (font-mono caps labels,
 * cream surfaces, forest-deep ink, lime accent). The submit button mirrors
 * the newsletter band's forest→lime arrow chip.
 */

type Subject = "general" | "wholesale" | "press" | "other";

const SUBJECT_OPTIONS: ReadonlyArray<{ value: Subject; label: string; description: string }> = [
  { value: "general",   label: "General question",      description: "Anything about the farm or our flower." },
  { value: "wholesale", label: "Wholesale / Dispensary", description: "Carrying SPFarms in your shop." },
  { value: "press",     label: "Press & Media",         description: "Interviews, features, asset requests." },
  { value: "other",     label: "Something else",        description: "Doesn't fit the boxes above." },
];

const SUBJECT_LABELS: Record<Subject, string> = Object.fromEntries(
  SUBJECT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<Subject, string>;

const MAX_MESSAGE = 2000;

type Status = "idle" | "submitting" | "ok" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState<Subject>("general");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorMessage(null);

    try {
      await apiClient.submitContactRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: SUBJECT_LABELS[subject],
        message: message.trim(),
        website, // server-side honeypot
      });
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong, try again.",
      );
    }
  }

  function resetForm() {
    setName("");
    setEmail("");
    setPhone("");
    setSubject("general");
    setMessage("");
    setWebsite("");
    setStatus("idle");
    setErrorMessage(null);
  }

  /* ---------------------------------- Success state --------------------------------- */
  if (status === "ok") {
    return (
      <div className="rounded-[28px] bg-sf-cream-soft p-8 md:p-10">
        <div className="flex flex-col items-start gap-5">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-sf-lime text-sf-forest-deep">
            <CheckCircle2Icon className="size-6" strokeWidth={2.25} />
          </span>
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-sf-forest-deep">
              Message received.
            </h3>
            <p className="mt-2 text-base leading-relaxed text-sf-forest-deep/70">
              Thanks for reaching out{name ? `, ${name.split(" ")[0]}` : ""}. We&rsquo;ll get back
              to you at <span className="font-medium text-sf-forest-deep">{email}</span> within
              one to two business days.
            </p>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="mt-2 inline-flex items-center gap-2 rounded-md border border-sf-forest-deep/15 bg-sf-cream px-4 py-2.5 transition-colors hover:bg-sf-cream-deep/40"
          >
            <MetaText size="xs" className="text-sf-forest-deep">
              Send another
            </MetaText>
          </button>
        </div>
      </div>
    );
  }

  /* ----------------------------------- Form ---------------------------------------- */
  const submitting = status === "submitting";
  const messageTooLong = message.length > MAX_MESSAGE;
  const disabled =
    submitting ||
    !name.trim() ||
    !email.trim() ||
    !message.trim() ||
    messageTooLong;

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[28px] bg-sf-cream-soft p-6 md:p-8"
      aria-describedby="contact-form-status"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field id="contact-name" label="Your name" required>
          <input
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className={inputClass}
            placeholder="Jane Doe"
          />
        </Field>

        <Field id="contact-email" label="Email" required>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={200}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className={inputClass}
            placeholder="you@example.com"
          />
        </Field>

        <Field id="contact-phone" label="Phone (optional)">
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={40}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={submitting}
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </Field>

        <Field id="contact-subject" label="What's this about?">
          <select
            id="contact-subject"
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value as Subject)}
            disabled={submitting}
            className={cn(
              inputClass,
              "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2210%22 height=%226%22 viewBox=%220 0 10 6%22><path fill=%22none%22 stroke=%22%23355044%22 stroke-width=%221.5%22 d=%22M1 1l4 4 4-4%22/></svg>')] bg-size-[10px_6px] bg-position-[right_14px_center] bg-no-repeat pr-9",
            )}
          >
            {SUBJECT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="mt-4">
        <Field id="contact-message" label="Message" required>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={6}
            maxLength={MAX_MESSAGE + 100 /* gentle slack — server caps at 5000 */}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={submitting}
            className={cn(inputClass, "min-h-[150px] resize-y py-3 leading-relaxed tracking-normal normal-case")}
            placeholder="Tell us a bit about what you're looking for…"
          />
        </Field>
        <div className="mt-1.5 flex items-center justify-between">
          <MetaText size="xs" className="text-sf-forest-deep/50">
            {SUBJECT_OPTIONS.find((o) => o.value === subject)?.description}
          </MetaText>
          <MetaText
            size="xs"
            className={cn(
              "tabular-nums",
              messageTooLong ? "text-[#03602E]" : "text-sf-forest-deep/50",
            )}
          >
            {message.length}/{MAX_MESSAGE}
          </MetaText>
        </div>
      </div>

      {/* Honeypot — visually hidden, off accessibility tree, never tab-stoppable. */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <MetaText size="xs" className="text-sf-forest-deep/60">
          We&rsquo;ll never share your email.
        </MetaText>

        <button
          type="submit"
          disabled={disabled}
          className="group inline-flex items-center justify-center gap-2 self-start rounded-md bg-sf-forest-deep px-5 py-3 text-sf-lime transition-colors hover:bg-sf-forest disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
        >
          <MetaText size="xs" className="text-sf-lime">
            {submitting ? "Sending…" : "Send message"}
          </MetaText>
          <ArrowRightIcon
            className="size-3.5 transition-transform duration-300 ease-out group-hover:translate-x-1"
            strokeWidth={2.5}
          />
        </button>
      </div>

      <div id="contact-form-status" aria-live="polite" className="mt-4 min-h-5">
        {status === "error" && (
          <div className="flex items-start gap-2 rounded-md bg-[#03602E]/10 px-3 py-2.5 text-[#03602E]">
            <AlertCircleIcon className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
            <p className="text-sm leading-snug">
              {errorMessage || "Something went wrong, please try again."}
            </p>
          </div>
        )}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Internals                                                                  */
/* -------------------------------------------------------------------------- */

// Inputs use normal-case `text-base` so prose stays legible — the mono /
// uppercase styling lives only on the field labels (via <MetaText>) and on
// shorter filter inputs in find-us-section.tsx / newsletter-band.tsx.
const inputClass =
  "h-11 w-full rounded-md border border-sf-cream-deep bg-sf-cream px-3.5 text-base text-sf-forest-deep placeholder:text-sf-forest-deep/35 transition-colors outline-none focus:border-sf-forest focus:ring-2 focus:ring-sf-forest/15 disabled:opacity-60";

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-1.5">
        <MetaText size="xs" className="text-sf-forest-deep/70">
          {label}
        </MetaText>
        {required && (
          <span className="text-sf-orange" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
