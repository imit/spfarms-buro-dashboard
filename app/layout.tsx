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
        <Toaster />
      </body>
    </html>
  );
}
