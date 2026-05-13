import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "SPFarms Wholesale Cannabis",
    template: "SPFarms Wholesale Cannabis - %s",
  },
  description:
    "Wholesale cannabis management platform for micro farms — products, strains, samples, dispensary storefronts, and grow operations.",
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
