import { cn } from "@/lib/utils";
import { MetaText } from "./meta-text";

/**
 * Small section eyebrow used above headlines, e.g. "browse our strains",
 * "Find dispensaries near you", "let's be partners".
 *
 * Styled lowercase forest-green to match the sketch.
 */
export function SectionLabel({
  children,
  className,
  trailingIcon,
}: {
  children: React.ReactNode;
  className?: string;
  trailingIcon?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-2 text-sf-forest-deep",
        className,
      )}
    >
      <MetaText size="sm" className="normal-case">
        {children}
      </MetaText>
      {trailingIcon}
    </span>
  );
}
