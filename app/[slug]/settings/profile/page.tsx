"use client";

import { useEffect, useState } from "react";
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

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
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
    }
  }, [user]);

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
  );
}
