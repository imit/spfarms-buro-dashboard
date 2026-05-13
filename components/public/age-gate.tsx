"use client";

import { useEffect, useState } from "react";
import { MetaText, FlowerPath } from "./style";
import { Logo } from "@/components/shared/logo";
import { cn } from "@/lib/utils";
import { setSiteCookie } from "@/lib/cookies";

/**
 * 21+ age verification modal shown on the public site.
 *
 * Persistence: a `sf_age_verified=1` cookie is set on YES with a 7-day TTL,
 * so returning visitors are re-prompted weekly.
 *
 * SSR: the layout reads the cookie server-side and passes `initiallyVerified`
 * so verified users never see a flash of the modal. For unverified users the
 * modal renders immediately above the page content (still SSR'd) and is
 * dismissed without a navigation.
 *
 * NO action: redirects off-site. We send to google.com — a common, neutral
 * cannabis-industry pattern. Swap `EXIT_URL` to change the destination.
 */

const COOKIE = "sf_age_verified";
const ONE_WEEK_SECONDS = 60 * 60 * 24 * 7;
const EXIT_URL = "https://www.google.com";

function setVerifiedCookie() {
  setSiteCookie(COOKIE, "1", { maxAge: ONE_WEEK_SECONDS });
}

export function AgeGate({ initiallyVerified }: { initiallyVerified: boolean }) {
  // Default to the SSR value so server + client first paint agree (no hydration
  // mismatch). We never *re-open* once dismissed in this session, even if the
  // cookie expires mid-visit.
  const [open, setOpen] = useState(!initiallyVerified);

  // Lock background scroll while the modal is up.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function onYes() {
    setVerifiedCookie();
    setOpen(false);
  }

  function onNo() {
    window.location.href = EXIT_URL;
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-stretch justify-center md:items-center md:bg-sf-forest-deep/60 md:p-8 md:backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      {/* Card — full-bleed lime takeover on mobile, floating rounded card on desktop */}
      <div className="relative flex w-full flex-col overflow-hidden bg-sf-lime md:max-w-[1100px] md:rounded-[40px]">
        <div className="grid h-full grid-cols-1 md:min-h-[560px] md:grid-cols-[1fr_1fr]">
          {/* Copy + buttons */}
          <div className="flex h-full flex-col p-6 md:p-10">
            <MetaText
              size="md"
              className="normal-case tracking-normal text-sf-forest-deep"
            >
              Welcome
            </MetaText>

            <div className="mt-4 w-44 md:mt-6 md:w-56">
              <Logo />
            </div>

            {/* Mobile-only inline flower image — sits between logo and headline,
                contained inside the column so it can't overflow buttons. */}
            <div className="mx-auto my-8 w-[78%] max-w-[320px] md:hidden">
              <FlowerClippedImage src="/assets/b11.jpg" className="aspect-square" />
            </div>

            <h2
              id="age-gate-title"
              className="text-[40px] font-bold leading-[1.05] tracking-tight text-sf-forest-deep md:mt-auto md:pt-12 md:text-[56px]"
            >
              Are you 21
              <br />
              or older?
            </h2>

            <div className="mt-8 flex gap-3 md:mt-10">
              <GateButton onClick={onYes} autoFocus>
                Yes
              </GateButton>
              <GateButton onClick={onNo} variant="ghost">
                No
              </GateButton>
            </div>
          </div>

          {/* Right: bud photo clipped into the design-system flower silhouette
              (desktop only — mobile renders the image inline above the headline) */}
          <div className="relative hidden md:block">
            <FlowerClippedImage
              src="/assets/b11.jpg"
              className="absolute inset-0"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Internals                                                          */
/* ------------------------------------------------------------------ */

function GateButton({
  children,
  onClick,
  variant = "primary",
  autoFocus,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      autoFocus={autoFocus}
      className={cn(
        "h-12 min-w-[140px] rounded-full border border-sf-forest-deep px-8 font-mono text-xs uppercase tracking-[0.18em] transition-colors",
        variant === "primary"
          ? "bg-sf-forest-deep text-sf-cream hover:bg-sf-ink"
          : "bg-transparent text-sf-forest-deep hover:bg-sf-forest-deep hover:text-sf-cream",
      )}
    >
      {children}
    </button>
  );
}

/**
 * Renders an image clipped into the 5-petal flower silhouette from the design
 * system. Uses a plain SVG `<image>` (not foreignObject) so it composites
 * reliably across Safari/Firefox. The area outside the petals stays
 * transparent so the lime card background shows through.
 *
 * Trade-off vs `next/image`: no automatic optimization for this single decorative
 * image. Acceptable — it only renders in the modal and `b11.jpg` is already
 * served from /public.
 */
function FlowerClippedImage({
  src,
  className,
}: {
  src: string;
  className?: string;
}) {
  const clipId = "age-gate-flower-clip";
  return (
    <div className={cn("relative", className)}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        className="size-full"
        aria-hidden="true"
      >
        <defs>
          <clipPath id={clipId}>
            <FlowerPath fill="#fff" />
          </clipPath>
        </defs>
        <image
          href={src}
          x="0"
          y="0"
          width="100"
          height="100"
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  );
}
