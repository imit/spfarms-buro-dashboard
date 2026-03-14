"use client";

import { use, useEffect, useState } from "react";
import Avatar from "boring-avatars";
import { Loader2Icon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

export default function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [companyTitle, setCompanyTitle] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const profileData = await apiClient.getProfile();
        updateUser(profileData);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoaded(true);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setPhoneNumber(user.phone_number || "");
      const membership = user.companies?.find((c) => c.slug === slug);
      setCompanyTitle(membership?.company_title || "");
    }
  }, [user, slug]);

  async function handleSaveProfile() {
    setSavingProfile(true);
    try {
      const updated = await apiClient.updateProfile({
        full_name: fullName,
        phone_number: phoneNumber,
        company_title: companyTitle,
      }, slug);
      updateUser(updated);
      toast.success("Profile updated");
    } catch (err) {
      showError("update your profile", err);
    } finally {
      setSavingProfile(false);
    }
  }

  if (!loaded) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Profile</h2>
      <Separator className="mb-4" />
      <div className="flex items-center gap-4 mb-6">
        <Avatar
          name={user?.full_name || user?.email || "User"}
          variant="beam"
          size={56}
          colors={["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]}
        />
        <div>
          <p className="font-medium text-base">{user?.full_name || "Your Name"}</p>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <div className="grid gap-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-base">Full Name</Label>
          <Input
            id="fullName"
            className="h-12 text-base"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-base">Phone Number</Label>
          <Input
            id="phone"
            className="h-12 text-base"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="(555) 123-4567"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyTitle" className="text-base">Title</Label>
          <Input
            id="companyTitle"
            className="h-12 text-base"
            value={companyTitle}
            onChange={(e) => setCompanyTitle(e.target.value)}
            placeholder="e.g. Purchase Manager, Owner, Buyer"
          />
        </div>
      </div>
      <Button
        className="mt-6 w-full"
        size="lg"
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
  );
}
