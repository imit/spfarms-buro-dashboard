import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { Toaster } from "sonner";

/**
 * Site fonts:
 *   Circular Std    — body + display (loaded via @font-face in globals.css)
 *   Suisse Intl Mono — mono labels (loaded via @font-face in globals.css)
 *
 * Both font stacks fall back to system fonts gracefully if the files aren't
 * present in /public/fonts. No Google Fonts download.
 */

// Canonical site origin. Override via NEXT_PUBLIC_SITE_URL in non-prod
// environments (preview deploys, local dev) so OG/twitter URLs resolve
// to the right host. Defaults to the production apex domain.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://spfarmsny.com";

const SITE_DESCRIPTION =
  "SPFarms is a New York micro cannabis farm growing small-batch, indoor, living-soil flower in the Catskills. Find us at dispensaries across NY.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SPFarms — Craft Indoor Cannabis from the Catskills",
    template: "%s — SPFarms",
  },
  description: SITE_DESCRIPTION,
  applicationName: "SPFarms",
  authors: [{ name: "SPFarms" }],
  keywords: [
    "cannabis",
    "craft cannabis",
    "indoor cannabis",
    "living soil",
    "New York cannabis",
    "Catskills cannabis",
    "small batch flower",
    "micro farm",
    "wholesale cannabis NY",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "SPFarms",
    title: "SPFarms — Craft Indoor Cannabis from the Catskills",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "SPFarms — Craft Indoor Cannabis from the Catskills",
    description: SITE_DESCRIPTION,
    site: "@spfarmsny",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#F7F7F4", // sf-cream — matches the public header background
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <TooltipProvider>
          <AuthProvider>
            <ImpersonationBanner />
            {children}
          </AuthProvider>
        </TooltipProvider>
        <Toaster
          position="top-center"
          expand
          closeButton
          style={{ width: "100%", maxWidth: "100vw", left: 0, right: 0, transform: "none", padding: "0 1rem", boxSizing: "border-box" }}
          toastOptions={{
            style: {
              background: "#F5D922",
              color: "#1a1a1a",
              border: "none",
              borderRadius: "0.75rem",
              fontSize: "1rem",
              fontWeight: 500,
              padding: "0.875rem 1.25rem",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box",
            },
          }}
        />
      </body>
    </html>
  );
}
