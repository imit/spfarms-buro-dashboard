import { cn } from "@/lib/utils";

/**
 * 5-petal blob mask used behind product images on the strain cards.
 *
 * Renders as a colored "flower" silhouette behind whatever you put in `children`.
 * The shape is a single SVG path (no clip-path) so it composites cleanly on
 * any background. Use a child <img> and let it sit centered on top.
 *
 *   <FlowerShape color="orange" size={300}>
 *     <img src={...} className="absolute inset-0 m-auto h-3/4" />
 *   </FlowerShape>
 *
 * The path is parameterized by viewBox 0 0 100 100, so any size scales cleanly.
 */
export function FlowerShape({
  children,
  color = "orange",
  className,
}: {
  children?: React.ReactNode;
  color?: "orange" | "lime" | "forest" | "cream";
  className?: string;
}) {
  const fill = {
    orange: "var(--sf-orange)",
    lime: "var(--sf-lime)",
    forest: "var(--sf-forest)",
    cream: "var(--sf-cream-soft)",
  }[color];

  return (
    <div className={cn("relative isolate", className)}>
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <FlowerPath fill={fill} />
      </svg>
      {/* Children layered above the petal silhouette */}
      <div className="relative z-10 size-full">{children}</div>
    </div>
  );
}

/** The raw SVG path — exported so other primitives (avatars, masks) can reuse it. */
export function FlowerPath({ fill = "currentColor" }: { fill?: string }) {
  // 5-petal flower roughly centered at (50,50). Each petal is a smooth bulge;
  // overlapping circles at 5 points around the center plus a center disc.
  return (
    <g fill={fill}>
      {/* Petals: 5 circles arranged around center */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * 72 - 90) * (Math.PI / 180); // start at top, 72° apart
        const cx = 50 + Math.cos(angle) * 26;
        const cy = 50 + Math.sin(angle) * 26;
        return <circle key={i} cx={cx} cy={cy} r={24} />;
      })}
      {/* Center disc fills the gap */}
      <circle cx={50} cy={50} r={20} />
    </g>
  );
}
