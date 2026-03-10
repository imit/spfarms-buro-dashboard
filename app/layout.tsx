import type { Metadata } from "next";
import { Work_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

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
      <body
        className={`${workSans.className} ${ibmPlexMono.variable} antialiased`}
      >
        <TooltipProvider>
          <AuthProvider>{children}</AuthProvider>
        </TooltipProvider>
        <Toaster
          position="top-center"
          expand
          style={{ width: "100%", left: 0, right: 0, transform: "none", padding: "0 1rem" }}
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
            },
          }}
        />
      </body>
    </html>
  );
}
