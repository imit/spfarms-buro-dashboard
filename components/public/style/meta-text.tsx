import { cn } from "@/lib/utils";

/**
 * Small uppercase mono-tracked label.
 * Used for top-bar meta (CATSKILLS, NEW YORK · 07:30 AM · 32°F),
 * section eyebrows, key/value pairs, etc.
 *
 * Storefront design system primitive — see components/public/style/README.
 */
export function MetaText({
  children,
  size = "sm",
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  /** sm = 11px (default ticker/eyebrow), xs = 10px (top-bar inline) */
  size?: "xs" | "sm" | "md";
  className?: string;
  /** Element to render — restricted to ones that accept children */
  as?: "span" | "p" | "div" | "label" | "small" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}) {
  return (
    <Tag
      className={cn(
        "font-mono uppercase tracking-[0.18em] tabular-nums",
        size === "xs" && "text-[10px]",
        size === "sm" && "text-[11px]",
        size === "md" && "text-xs",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
