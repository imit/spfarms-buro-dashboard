import Image from "next/image";
import Link from "next/link";
import { MetaText } from "./style";
import { FindDispensariesBadge } from "./find-dispensaries-badge";
import { SlideshowOverlay } from "./slideshow-overlay";
import { cn } from "@/lib/utils";

/**
 * Two side-by-side image cards, each carrying a small label in the corner
 * and an arrow CTA. Mirrors the sketch's "Find dispensaries near you" +
 * "Let's be partners" row.
 *
 * Each card is a Link so the whole image is tappable.
 */
export function DualCallout({
  cards = DEFAULT_CARDS,
}: {
  cards?: ReadonlyArray<{
    label: string;
    href: string;
    image: string;
    /** "left" places the label top-left; default is top-left for both */
    labelPos?: "top-left" | "top-right";
    /** Color of the card surround when no image fills */
    bg?: "sky" | "lime" | "cream";
    /** Optional sticker rendered centered over the image */
    badge?: React.ReactNode;
    /** Optional list of (transparent) image paths to cycle on top of the base image */
    slides?: ReadonlyArray<string>;
    /** Delay between slides in ms (default 1000) */
    slideIntervalMs?: number;
  }>;
}) {
  return (
    <section className="px-4 py-8 md:px-8 md:py-12">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
        {cards.map((card) => (
          <CalloutCard key={card.href} {...card} />
        ))}
      </div>
    </section>
  );
}

function CalloutCard({
  label,
  href,
  image,
  labelPos = "top-left",
  bg = "sky",
  badge,
  slides,
  slideIntervalMs,
}: {
  label: string;
  href: string;
  image: string;
  labelPos?: "top-left" | "top-right";
  bg?: "sky" | "lime" | "cream";
  badge?: React.ReactNode;
  slides?: ReadonlyArray<string>;
  slideIntervalMs?: number;
}) {
  const bgClass = {
    sky: "bg-sf-sky",
    lime: "bg-sf-lime",
    cream: "bg-sf-cream-soft",
  }[bg];

  return (
    <Link href={href} className="group block">
      {/* Label sits above the image, no overlap */}
      <div
        className={cn(
          "flex items-center gap-3",
          labelPos === "top-right" && "justify-end",
        )}
      >
        <MetaText
          size="md"
          className="normal-case tracking-normal text-sf-forest-deep"
        >
          {label}
        </MetaText>
        <Image
          src="/assets/cursor.png"
          alt=""
          width={28}
          height={28}
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1.5 md:size-3.5"
        />
      </div>

      {/* Image card */}
      <div
        className={cn(
          "relative mt-4 aspect-4/3 overflow-hidden rounded-[28px] md:mt-5",
          bgClass,
        )}
      >
        <Image
          src={image}
          alt=""
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />

        {/* Optional transparent-PNG slideshow on top of the base image */}
        {slides && slides.length > 0 ? (
          <SlideshowOverlay
            slides={slides}
            intervalMs={slideIntervalMs}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : null}

        {/* Centered sticker overlay */}
        {badge ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-[34%] max-w-[200px] drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-transform duration-500 ease-out group-hover:-rotate-6">
              {badge}
            </div>
          </div>
        ) : null}
      </div>
    </Link>
  );
}

const DEFAULT_CARDS = [
  {
    label: "Find dispensaries near you",
    href: "/find-us",
    image: "/assets/b11.jpg",
    labelPos: "top-left" as const,
    bg: "sky" as const,
    badge: <FindDispensariesBadge className="h-auto w-full" />,
  },
  {
    label: "Let's work together",
    href: "/wholesale/register",
    image: "/assets/h-bg.jpg",
    labelPos: "top-left" as const,
    bg: "sky" as const,
    slides: [
      "/assets/slides/s1.png",
      "/assets/slides/s2.png",
      "/assets/slides/s3.png",
      "/assets/slides/s4.png",
      "/assets/slides/s5.png",
      "/assets/slides/s6.png",
      "/assets/slides/s7.png",
    ],
  },
];
