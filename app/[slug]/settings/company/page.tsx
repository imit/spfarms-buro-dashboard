"use client";

import { use, useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  Loader2Icon,
  ImageIcon,
  InfoIcon,
} from "lucide-react";
import {
  apiClient,
  type Company,
  type Location,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

interface LocationForm {
  id?: number;
  name: string;
  license_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
}

const EMPTY_LOCATION: LocationForm = {
  name: "",
  license_number: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  phone_number: "",
};

export default function CompanySettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<LocationForm>(EMPTY_LOCATION);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<LocationForm>(EMPTY_LOCATION);
  const [savingLocation, setSavingLocation] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const companyData = await apiClient.getCompany(slug);
        setCompany(companyData);
        setCompanyName(companyData.name);
        setLicenseNumber(companyData.license_number || "");
        setCompanyEmail(companyData.email || "");
        setCompanyPhone(companyData.phone_number || "");
      } catch (err) {
        console.error("Failed to load company:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

  async function handleSaveCompany() {
    setSavingCompany(true);
    try {
      const updated = await apiClient.updateCompany(slug, {
        name: companyName,
        license_number: licenseNumber || null,
        email: companyEmail || null,
        phone_number: companyPhone || null,
      });
      setCompany(updated);
      toast.success("Company updated");
    } catch (err) {
      showError("update the company info", err);
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("company[logo]", file);
      const updated = await apiClient.updateCompanyWithFormData(slug, formData);
      setCompany(updated);
      toast.success("Logo updated");
    } catch (err) {
      showError("upload the logo", err);
    } finally {
      setUploadingLogo(false);
    }
  }

  function startEditLocation(loc: Location) {
    setEditingLocationId(loc.id);
    setEditForm({
      id: loc.id,
      name: loc.name || "",
      license_number: loc.license_number || "",
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      zip_code: loc.zip_code || "",
      phone_number: loc.phone_number || "",
    });
  }

  function cancelEditLocation() {
    setEditingLocationId(null);
    setEditForm(EMPTY_LOCATION);
  }

  async function handleSaveLocation(form: LocationForm, isNew: boolean) {
    if (!company) return;
    setSavingLocation(true);
    try {
      const attrs: Record<string, unknown> = {
        name: form.name,
        license_number: form.license_number || null,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        phone_number: form.phone_number,
      };
      if (form.id) attrs.id = form.id;

      const updated = await apiClient.updateCompany(slug, {
        locations_attributes: [attrs],
      });
      setCompany(updated);
      if (isNew) {
        setAddingLocation(false);
        setNewLocation(EMPTY_LOCATION);
      } else {
        setEditingLocationId(null);
        setEditForm(EMPTY_LOCATION);
      }
      toast.success(isNew ? "Location added" : "Location updated");
    } catch (err) {
      showError("save the location", err);
    } finally {
      setSavingLocation(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const locations = company?.locations || [];

  return (
    <div className="space-y-8">
      {/* Company Info */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Company Info</h2>
        <Separator className="mb-4" />

        <div className="flex items-center gap-4 mb-6">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={company.name}
              className="size-16 rounded-lg object-cover border"
            />
          ) : (
            <div className="size-16 rounded-lg border border-dashed bg-muted flex items-center justify-center text-muted-foreground">
              <ImageIcon className="size-6" />
            </div>
          )}
          <div className="space-y-1">
            <p className="text-sm font-medium">Company Logo</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleLogoUpload(file);
                e.target.value = "";
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              disabled={uploadingLogo}
            >
              {uploadingLogo ? (
                <>
                  <Loader2Icon className="mr-1.5 size-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                company?.logo_url ? "Change Logo" : "Upload Logo"
              )}
            </Button>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-base">Company Name</Label>
            <Input
              id="companyName"
              className="h-12 text-base"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber" className="text-base">License Number</Label>
            <Input
              id="licenseNumber"
              className="h-12 text-base"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="OCM-XXXXX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyEmail" className="text-base">Company Email</Label>
            <Input
              id="companyEmail"
              type="email"
              className="h-12 text-base"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="info@company.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyPhoneNumber" className="text-base">Company Phone</Label>
            <Input
              id="companyPhoneNumber"
              className="h-12 text-base"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <Button
          className="mt-6 w-full"
          size="lg"
          onClick={handleSaveCompany}
          disabled={savingCompany}
        >
          {savingCompany ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Company"
          )}
        </Button>
      </section>

      {/* Locations */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Locations</h2>
            <Popover>
              <PopoverTrigger asChild>
                <button className="size-8 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 hover:bg-amber-200 transition-colors">
                  <InfoIcon className="size-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="bottom"
                align="start"
                className="w-80 bg-amber-50 border-amber-200 text-amber-900"
              >
                <p className="text-sm leading-relaxed">
                  If you have multiple dispensary locations, you can add each one here
                  with its own address and OCM license number. When placing an order,
                  you'll be able to select which location to ship to and bill from.
                </p>
              </PopoverContent>
            </Popover>
          </div>
          {!addingLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingLocation(true)}
            >
              <PlusIcon className="mr-1.5 size-4" />
              Add Location
            </Button>
          )}
        </div>
        <Separator className="mb-4" />

        <div className="space-y-3">
          {locations.map((loc) =>
            editingLocationId === loc.id ? (
              <LocationFormCard
                key={loc.id}
                form={editForm}
                onChange={setEditForm}
                onSave={() => handleSaveLocation(editForm, false)}
                onCancel={cancelEditLocation}
                saving={savingLocation}
              />
            ) : (
              <div
                key={loc.id}
                className="flex items-start justify-between rounded-lg border p-5"
              >
                <div className="space-y-0.5">
                  {loc.name && (
                    <p className="font-medium text-base">{loc.name}</p>
                  )}
                  {loc.license_number && (
                    <p className="text-sm text-muted-foreground">OCM: {loc.license_number}</p>
                  )}
                  <p className="text-base text-muted-foreground">{loc.address}</p>
                  <p className="text-base text-muted-foreground">
                    {[loc.city, loc.state, loc.zip_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {loc.phone_number && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {loc.phone_number}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-9"
                  onClick={() => startEditLocation(loc)}
                >
                  <PencilIcon className="size-4" />
                </Button>
              </div>
            )
          )}

          {locations.length === 0 && !addingLocation && (
            <p className="text-sm text-muted-foreground py-4">
              No locations yet. Add one for shipping and billing.
            </p>
          )}

          {addingLocation && (
            <LocationFormCard
              form={newLocation}
              onChange={setNewLocation}
              onSave={() => handleSaveLocation(newLocation, true)}
              onCancel={() => {
                setAddingLocation(false);
                setNewLocation(EMPTY_LOCATION);
              }}
              saving={savingLocation}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function LocationFormCard({
  form,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  form: LocationForm;
  onChange: (form: LocationForm) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <div className="rounded-lg border p-5 space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label className="text-base">Location Name</Label>
          <Input
            className="h-12 text-base"
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Main Office"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base">OCM License</Label>
          <Input
            className="h-12 text-base"
            value={form.license_number}
            onChange={(e) => onChange({ ...form, license_number: e.target.value })}
            placeholder="OCM-XXXXX"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base">Address</Label>
          <Input
            className="h-12 text-base"
            value={form.address}
            onChange={(e) => onChange({ ...form, address: e.target.value })}
            placeholder="123 Main St"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base">City</Label>
          <Input
            className="h-12 text-base"
            value={form.city}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            placeholder="New York"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base">State</Label>
            <Input
              className="h-12 text-base"
              value={form.state}
              onChange={(e) => onChange({ ...form, state: e.target.value })}
              placeholder="NY"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-base">ZIP</Label>
            <Input
              className="h-12 text-base"
              value={form.zip_code}
              onChange={(e) => onChange({ ...form, zip_code: e.target.value })}
              placeholder="10001"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-base">Phone</Label>
          <Input
            className="h-12 text-base"
            value={form.phone_number}
            onChange={(e) => onChange({ ...form, phone_number: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button size="lg" className="w-full" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckIcon className="mr-1.5 size-4" />
          )}
          Save Location
        </Button>
        <Button variant="outline" size="lg" className="w-full" onClick={onCancel} disabled={saving}>
          <XIcon className="mr-1.5 size-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
