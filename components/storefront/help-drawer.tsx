"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { apiClient } from "@/lib/api";

export function openHelpDrawer() {
  window.dispatchEvent(new CustomEvent("help:open"));
}

export function HelpDrawer() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const pathname = usePathname();
  const slug = pathname?.split("/")[1] || "";

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("help:open", handler);
    return () => window.removeEventListener("help:open", handler);
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSubmitting(true);

    try {
      const company = await apiClient.getCompany(slug);
      await apiClient.createSupportTicket({
        subject: "Question from storefront",
        message: message.trim(),
        company_id: company.id,
      });

      setSubmitted(true);
      toast.success("Message sent! We'll get back to you soon.");

      setTimeout(() => {
        setOpen(false);
        setMessage("");
        setSubmitted(false);
      }, 2000);
    } catch {
      toast.error("Something went wrong. Please try emailing us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) {
        setMessage("");
        setSubmitted(false);
      }
    }}>
      <DrawerContent className="mx-auto max-w-lg" style={{ backgroundColor: "#F9EB65" }}>
        <DrawerTitle className="sr-only">Contact us</DrawerTitle>
        <div className="px-6 pb-10 pt-2">

          {/* Bear icon */}
          <div className="flex justify-center mb-4">
            <img src="/panda-symbol.svg" alt="SPFarms" className="size-12" />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2">Hey there</h2>
          <p className="text-base text-center text-foreground/70 mb-6">
            Ask us anything about our flower, ideas, questions, or partnerships or issues
          </p>

          {/* Textarea */}
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={6}
            className="w-full rounded-2xl border-0 bg-white p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            disabled={submitting || submitted}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || submitting || submitted}
            className="mt-4 w-full rounded-xl bg-primary hover:bg-primary/80 text-primary-foreground py-3.5 text-base font-semibold transition-colors disabled:opacity-50"
          >
            {submitted ? "Sent!" : submitting ? "Sending..." : "Submit"}
          </button>

          {/* Email fallback */}
          <p className="text-center text-sm text-foreground/50 mt-4">
            or email{" "}
            <a href="mailto:info@spfarmsny.com" className="underline hover:text-foreground/70">
              info@spfarmsny.com
            </a>
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
