import { cn } from "@/lib/utils";

/**
 * Small leaf glyph used as a bullet/separator between marquee items
 * and inline meta strings. Roughly 5-petal flower silhouette.
 */
export function LeafBullet({
  className,
  size = 16,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={cn("inline-block shrink-0", className)}
    >
      <path d="M12 2c1.6 2.6 3.6 4 6 4-1 2.6-1 5 0 7.5-2.6-.6-4.6.4-6 3-1.4-2.6-3.4-3.6-6-3 1-2.5 1-5 0-7.5 2.4 0 4.4-1.4 6-4z" />
    </svg>
  );
}
