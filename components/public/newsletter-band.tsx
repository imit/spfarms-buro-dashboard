"use client";

import { useRef, useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import confetti from "canvas-confetti";
import { MetaText } from "./style";
import { apiClient } from "@/lib/api";

/**
 * Fire a brand-colored confetti burst originating from the given DOM rect
 * (so it shoots out from the submit button, not the page center). Brand
 * palette = lime + forest-deep + cream. Capped at ~1.2s so it doesn't
 * overstay its welcome.
 */
function fireSubscribeConfetti(rect: DOMRect) {
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  const colors = ["#C8E62F", "#B7D425", "#26251E", "#F7F7F4"];

  // Two angled bursts → a fan shape coming out of the button
  confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    decay: 0.92,
    scalar: 0.9,
    origin: { x, y },
    colors,
  });
  confetti({
    particleCount: 40,
    angle: 60,
    spread: 55,
    startVelocity: 50,
    decay: 0.92,
    scalar: 0.9,
    origin: { x: Math.max(0, x - 0.05), y },
    colors,
  });
  confetti({
    particleCount: 40,
    angle: 120,
    spread: 55,
    startVelocity: 50,
    decay: 0.92,
    scalar: 0.9,
    origin: { x: Math.min(1, x + 0.05), y },
    colors,
  });
}

/**
 * Lime newsletter band — full-width across the page (no rounded corners).
 *
 * Sketch maps to:
 *   "All cannabis, no spam. Get the newsletter"   [email input → ]
 *
 * Submits to /api/v1/public/newsletter_subscriptions. Admins see subscribers
 * at /admin/subscribers in the dashboard.
 *
 * Styling note: the input matches the site's other public form fields (see
 * components/public/find-us-section.tsx) — slightly-rounded `rounded-md`
 * corners, cream surface inside a forest-deep border, and a mono uppercase
 * label-style placeholder. Not the pill-shaped chip we had before.
 */
export function NewsletterBand() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "ok" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("submitting");
    setErrorMessage(null);
    try {
      await apiClient.subscribeToNewsletter({ email: trimmed, source: "homepage" });
      setStatus("ok");
      setEmail("");
      // Celebrate — confetti burst originating from the submit button.
      const rect = submitButtonRef.current?.getBoundingClientRect();
      if (rect) fireSubscribeConfetti(rect);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Something went wrong, try again.",
      );
    }
  }

  return (
    <section className="bg-sf-lime text-sf-forest-deep">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-5 py-16 md:grid-cols-[1fr_1fr] md:px-8 md:py-24">
        <div>
          <MetaText size="md" className="block text-sf-forest-deep/70 normal-case tracking-wider">
            Newsletter
          </MetaText>
          <h2 className="mt-3 text-[42px] font-bold leading-[1.05] tracking-tight">
            All cannabis,
            <br />
            no spam.
            <span className="block italic font-bold">Get the newsletter.</span>
          </h2>
        </div>

        <div className="flex flex-col justify-end">
          <form onSubmit={onSubmit} className="relative w-full max-w-md">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              placeholder="YOU@EXAMPLE.COM"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              className="h-12 w-full rounded-md border border-sf-forest-deep/80 bg-sf-cream pl-4 pr-14 font-mono text-xs uppercase tracking-[0.18em] text-sf-forest-deep placeholder:text-sf-forest-deep/40 focus:border-sf-forest-deep focus:outline-none focus:ring-2 focus:ring-sf-forest-deep/15 disabled:opacity-60"
            />
            <button
              ref={submitButtonRef}
              type="submit"
              aria-label="Subscribe"
              disabled={status === "submitting"}
              className="absolute right-1 top-1 inline-flex h-10 w-10 items-center justify-center rounded-md bg-sf-forest-deep text-sf-lime transition-colors hover:bg-sf-forest disabled:opacity-60"
            >
              <ArrowRightIcon className="size-4" strokeWidth={2.5} />
            </button>
          </form>

          <div className="mt-4 min-h-5" aria-live="polite">
            {status === "ok" && (
              <MetaText size="xs" className="text-sf-forest-deep/80">
                Thanks — you&rsquo;re on the list.
              </MetaText>
            )}
            {status === "error" && (
              <MetaText size="xs" className="text-sf-forest-deep/80">
                {errorMessage || "Something went wrong, try again."}
              </MetaText>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
