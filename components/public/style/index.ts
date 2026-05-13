/**
 * Storefront (public site) design-system primitives.
 *
 * Tokens live as CSS custom properties (--sf-*) declared in app/globals.css
 * and exposed through Tailwind as `bg-sf-cream`, `text-sf-forest`, etc.
 *
 * Primitives here wrap those tokens for the shapes/patterns repeated across
 * the marketing site (top-bar meta caps, lime tickers, flower-shaped image
 * cells, lowercase section eyebrows).
 *
 * Fonts:
 *   font-sans     — Circular Std (body + headlines)
 *   font-display  — Circular Std (semantic alias for headline/emphasis use)
 *   font-mono     — Suisse Intl Mono (caps labels)
 *
 * Re-skin checklist (when adding a new section):
 *   1. Background = bg-sf-cream (default) or bg-sf-lime (accent band)
 *   2. Body text = text-sf-forest-deep, captions = text-sf-forest/70
 *   3. Section h2 = text-[42px] font-bold leading-[1.05] (the spec'd size)
 *   4. Tiny labels = <MetaText> (Suisse mono, uppercase, wide tracking)
 *   5. Italic emphasis words inside headlines = `italic` (Circular Std oblique)
 *   6. Product/feature image cells with personality = <FlowerShape>
 *   7. Animated brand-values strip = <Marquee variant="lime">
 */
export { MetaText } from "./meta-text";
export { LeafBullet } from "./leaf-bullet";
export { Marquee } from "./marquee";
export { MarqueeGlyph } from "./marquee-glyphs";
export { FlowerShape, FlowerPath } from "./flower-shape";
export { SectionLabel } from "./section-label";
