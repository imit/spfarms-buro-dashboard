"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { ArrowLeftIcon, CheckCircleIcon, BuildingIcon, UserIcon, MapPinIcon } from "lucide-react";

export default function WholesaleRegisterPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_website: "",
    license_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_title: "",
  });

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await apiClient.registerPartnership({
        company: {
          name: form.company_name,
          email: form.company_email || undefined,
          phone_number: form.company_phone || undefined,
          website: form.company_website || undefined,
          license_number: form.license_number || undefined,
        },
        location: form.address
          ? {
              address: form.address,
              city: form.city || undefined,
              state: form.state || undefined,
              zip_code: form.zip_code || undefined,
            }
          : undefined,
        contact: {
          full_name: form.contact_name,
          email: form.contact_email,
          phone_number: form.contact_phone,
          title: form.contact_title || undefined,
        },
      });
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon className="size-7 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold">Application Submitted</h2>
          <p className="text-muted-foreground">
            Thank you for your interest in partnering with SPFarms. Our team
            will review your application and reach out within 1–2 business days.
          </p>
          <Button variant="outline" onClick={() => router.push("/wholesale")}>
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto max-w-2xl flex items-center justify-between px-4 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/wholesale")}>
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Become a Wholesale Partner</h1>
              <p className="text-sm text-muted-foreground">
                Fill out the form below and our team will get back to you
              </p>
            </div>
          </div>
          <div className="w-28 shrink-0">
            <Logo />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BuildingIcon className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Company Information</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  required
                  value={form.company_name}
                  onChange={(e) => update("company_name", e.target.value)}
                  placeholder="Your dispensary or business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_email">Company Email</Label>
                <Input
                  id="company_email"
                  type="email"
                  value={form.company_email}
                  onChange={(e) => update("company_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_phone">Company Phone</Label>
                <Input
                  id="company_phone"
                  value={form.company_phone}
                  onChange={(e) => update("company_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_website">Website</Label>
                <Input
                  id="company_website"
                  value={form.company_website}
                  onChange={(e) => update("company_website", e.target.value)}
                  placeholder="https://"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_number">License Number</Label>
                <Input
                  id="license_number"
                  value={form.license_number}
                  onChange={(e) => update("license_number", e.target.value)}
                  placeholder="OCM-XXXXX"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPinIcon className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Location</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip_code">ZIP Code</Label>
                  <Input
                    id="zip_code"
                    value={form.zip_code}
                    onChange={(e) => update("zip_code", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Person */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <UserIcon className="size-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Contact Person</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Full Name *</Label>
                <Input
                  id="contact_name"
                  required
                  value={form.contact_name}
                  onChange={(e) => update("contact_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email *</Label>
                <Input
                  id="contact_email"
                  type="email"
                  required
                  value={form.contact_email}
                  onChange={(e) => update("contact_email", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone Number *</Label>
                <Input
                  id="contact_phone"
                  required
                  value={form.contact_phone}
                  onChange={(e) => update("contact_phone", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_title">Title</Label>
                <Input
                  id="contact_title"
                  value={form.contact_title}
                  onChange={(e) => update("contact_title", e.target.value)}
                  placeholder="e.g. Owner, Manager, Buyer"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Partnership Application"}
          </Button>
        </form>
      </main>
    </div>
  );
}
