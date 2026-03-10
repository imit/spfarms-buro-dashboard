"use client";

import { use, useEffect, useState } from "react";
import Avatar from "boring-avatars";
import { PlusIcon, SendIcon, Loader2Icon } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import {
  apiClient,
  type Company,
  type CompanyMember,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { showError } from "@/lib/errors";

export default function TeamSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user } = useAuth();

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    async function load() {
      try {
        const companyData = await apiClient.getCompany(slug);
        setCompany(companyData);
      } catch (err) {
        console.error("Failed to load company:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [slug]);

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
      showError("invite this member", err);
    } finally {
      setSendingInvite(false);
    }
  }

  if (isLoading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const members: CompanyMember[] = company?.members || [];

  return (
    <div className="space-y-6">
      {members.length > 0 && (
        <div className="space-y-2">
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
    </div>
  );
}
