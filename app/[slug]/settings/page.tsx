"use client";

import { use, useEffect, useRef, useState } from "react";
import Avatar from "boring-avatars";
import {
  PlusIcon,
  PencilIcon,
  SendIcon,
  CheckIcon,
  XIcon,
  Loader2Icon,
  BuildingIcon,
  ImageIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Company,
  type Location,
  type CompanyMember,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface LocationForm {
  id?: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone_number: string;
}

const EMPTY_LOCATION: LocationForm = {
  name: "",
  address: "",
  city: "",
  state: "",
  zip_code: "",
  phone_number: "",
};

export default function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, updateUser } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Company info
  const [companyName, setCompanyName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPhone, setCompanyPhone] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Profile form
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Addresses
  const [editingLocationId, setEditingLocationId] = useState<number | null>(
    null
  );
  const [editForm, setEditForm] = useState<LocationForm>(EMPTY_LOCATION);
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocation, setNewLocation] = useState<LocationForm>(EMPTY_LOCATION);
  const [savingLocation, setSavingLocation] = useState(false);

  // Invite member
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteLookup, setInviteLookup] = useState<{
    id: number; email: string; full_name: string | null;
    phone_number: string | null; deleted: boolean; already_member: boolean;
  } | null>(null);
  const [inviteLookingUp, setInviteLookingUp] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || "");
    }
  }, [user]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.getCompany(slug);
        setCompany(data);
        setCompanyName(data.name);
        setLicenseNumber(data.license_number || "");
        setCompanyEmail(data.email || "");
        setCompanyPhone(data.phone_number || "");
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
      toast.error(
        err instanceof Error ? err.message : "Failed to update company"
      );
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
      toast.error(
        err instanceof Error ? err.message : "Failed to upload logo"
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const updated = await apiClient.updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
      });
      updateUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function startEditLocation(loc: Location) {
    setEditingLocationId(loc.id);
    setEditForm({
      id: loc.id,
      name: loc.name || "",
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
      toast.success(isNew ? "Address added" : "Address updated");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save address"
      );
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleInviteEmailLookup(email: string) {
    if (!email.trim() || !email.includes("@")) {
      setInviteLookup(null);
      return;
    }
    setInviteLookingUp(true);
    try {
      const result = await apiClient.lookupCompanyMember(slug, email);
      setInviteLookup(result);
      if (result && !result.already_member) {
        setInviteName(result.full_name || inviteName);
        setInvitePhone(result.phone_number || invitePhone);
      }
    } catch {
      setInviteLookup(null);
    } finally {
      setInviteLookingUp(false);
    }
  }

  async function handleInviteMember() {
    if (!inviteEmail.trim()) return;
    setSendingInvite(true);
    try {
      await apiClient.inviteCompanyMember(slug, {
        email: inviteEmail,
        full_name: inviteName || undefined,
        phone_number: invitePhone || undefined,
        company_title: inviteTitle || undefined,
      });
      const updated = await apiClient.getCompany(slug);
      setCompany(updated);
      setInviteEmail("");
      setInviteName("");
      setInvitePhone("");
      setInviteTitle("");
      setInviteLookup(null);
      toast.success(inviteLookup ? `${inviteEmail} added to this company` : `Invitation sent to ${inviteEmail}`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite member"
      );
    } finally {
      setSendingInvite(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const locations = company?.locations || [];
  const members: CompanyMember[] = company?.members || [];

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Company Info Section */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <BuildingIcon className="size-5" />
          <h2 className="text-lg font-semibold">Company</h2>
        </div>
        <Separator className="mb-4" />

        {/* Logo */}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Your company name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenseNumber">License Number</Label>
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="OCM-XXXXX"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyEmail">Company Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={companyEmail}
              onChange={(e) => setCompanyEmail(e.target.value)}
              placeholder="info@company.com"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="companyPhoneNumber">Company Phone</Label>
            <Input
              id="companyPhoneNumber"
              value={companyPhone}
              onChange={(e) => setCompanyPhone(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          size="sm"
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

      {/* Profile Section */}
      <section>
        <div className="flex items-center gap-4 mb-4">
          <Avatar
            name={user?.full_name || user?.email || "User"}
            variant="beam"
            size={56}
            colors={["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]}
          />
          <div>
            <h2 className="text-lg font-semibold">Profile</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Separator className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          size="sm"
          onClick={handleSaveProfile}
          disabled={savingProfile}
        >
          {savingProfile ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Profile"
          )}
        </Button>
      </section>

      {/* Addresses Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Addresses</h2>
          {!addingLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAddingLocation(true)}
            >
              <PlusIcon className="mr-1.5 size-4" />
              Add Address
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
                className="flex items-start justify-between rounded-lg border p-4"
              >
                <div>
                  {loc.name && (
                    <p className="font-medium text-sm">{loc.name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{loc.address}</p>
                  <p className="text-sm text-muted-foreground">
                    {[loc.city, loc.state, loc.zip_code]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {loc.phone_number && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {loc.phone_number}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => startEditLocation(loc)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
              </div>
            )
          )}

          {locations.length === 0 && !addingLocation && (
            <p className="text-sm text-muted-foreground py-4">
              No addresses yet. Add one for shipping and billing.
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

      {/* Team Section */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Team</h2>
        <Separator className="mb-4" />

        {members.length > 0 && (
          <div className="space-y-2 mb-6">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                <Avatar
                  name={member.full_name || member.email}
                  variant="beam"
                  size={32}
                  colors={[
                    "#264653",
                    "#2a9d8f",
                    "#e9c46a",
                    "#f4a261",
                    "#e76f51",
                  ]}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.full_name || member.email}
                  </p>
                  {member.full_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  )}
                </div>
                {member.company_title && (
                  <Badge variant="outline" className="text-xs shrink-0">
                    {member.company_title}
                  </Badge>
                )}
                {member.id === user?.id && (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    You
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border p-4 space-y-3">
          <h3 className="text-sm font-medium">Invite a Member</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="inviteEmail">Email *</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteLookup(null);
                }}
                onBlur={(e) => handleInviteEmailLookup(e.target.value)}
                placeholder="colleague@company.com"
              />
              {inviteLookingUp && (
                <p className="text-xs text-muted-foreground">Looking up user...</p>
              )}
              {inviteLookup && !inviteLookup.already_member && !inviteLookup.deleted && (
                <p className="text-xs text-blue-600">
                  Existing user found — will be added to this company
                </p>
              )}
              {inviteLookup?.deleted && (
                <p className="text-xs text-amber-600">
                  Deactivated account — will be restored and added
                </p>
              )}
              {inviteLookup?.already_member && (
                <p className="text-xs text-destructive">
                  Already a member of this company
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inviteName">Full Name</Label>
              <Input
                id="inviteName"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Jane Doe"
                disabled={!!inviteLookup && !inviteLookup.already_member && !inviteLookup.deleted}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invitePhone">Phone</Label>
              <Input
                id="invitePhone"
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="(555) 123-4567"
                disabled={!!inviteLookup && !inviteLookup.already_member && !inviteLookup.deleted}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inviteTitle">Title</Label>
              <Input
                id="inviteTitle"
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
                placeholder="Purchasing Manager"
              />
            </div>
          </div>
          <Button
            size="sm"
            onClick={handleInviteMember}
            disabled={sendingInvite || !inviteEmail.trim() || !!inviteLookup?.already_member}
          >
            {sendingInvite ? (
              <>
                <Loader2Icon className="mr-2 size-4 animate-spin" />
                Adding...
              </>
            ) : inviteLookup && !inviteLookup.already_member ? (
              <>
                <PlusIcon className="mr-2 size-4" />
                Add Existing User
              </>
            ) : (
              <>
                <SendIcon className="mr-2 size-4" />
                Send Invite
              </>
            )}
          </Button>
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
    <div className="rounded-lg border p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Location Name</Label>
          <Input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="Main Office"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={(e) => onChange({ ...form, address: e.target.value })}
            placeholder="123 Main St"
          />
        </div>
        <div className="space-y-1.5">
          <Label>City</Label>
          <Input
            value={form.city}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            placeholder="New York"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>State</Label>
            <Input
              value={form.state}
              onChange={(e) => onChange({ ...form, state: e.target.value })}
              placeholder="NY"
            />
          </div>
          <div className="space-y-1.5">
            <Label>ZIP</Label>
            <Input
              value={form.zip_code}
              onChange={(e) => onChange({ ...form, zip_code: e.target.value })}
              placeholder="10001"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label>Phone</Label>
          <Input
            value={form.phone_number}
            onChange={(e) => onChange({ ...form, phone_number: e.target.value })}
            placeholder="(555) 123-4567"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={saving}>
          {saving ? (
            <Loader2Icon className="mr-2 size-4 animate-spin" />
          ) : (
            <CheckIcon className="mr-1.5 size-4" />
          )}
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <XIcon className="mr-1.5 size-4" />
          Cancel
        </Button>
      </div>
    </div>
  );
}
