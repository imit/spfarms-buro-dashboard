"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MailIcon, Loader2Icon, CheckCircleIcon } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export default function VerifyMagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col items-center justify-center p-6">
          <div className="w-full max-w-md space-y-6">
            <div className="mx-auto w-48">
              <Logo />
            </div>
            <Card>
              <CardContent className="p-6 text-center">
                <h2 className="text-xl font-semibold mb-2">Loading...</h2>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyMagicLinkContent />
    </Suspense>
  );
}

function getSavedEmail(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )spf_email=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function VerifyMagicLinkContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(
    token ? null : "No token provided."
  );
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [email, setEmail] = useState(getSavedEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { user } = await apiClient.verifyMagicLink(token);
        posthog.capture("magic_link_verified", { user_id: user.id, email: user.email });
        loginWithToken(user);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "This link is no longer valid.";
        posthog.capture("magic_link_failed", { error: errorMessage, had_saved_email: !!getSavedEmail() });

        // If we have their email from a previous login, auto-send a new link
        const saved = getSavedEmail();
        if (saved) {
          setEmail(saved);
          setSending(true);
          try {
            await apiClient.requestMagicLink(saved);
            setSent(true);
            posthog.capture("magic_link_auto_resent", { email: saved });
          } catch {
            // Fall back to showing the form
            setError("This link is no longer valid.");
          } finally {
            setSending(false);
          }
        } else {
          setError(errorMessage);
        }
        setIsVerifying(false);
      }
    };

    verify();
  }, [token, loginWithToken]);

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await apiClient.requestMagicLink(email.trim());
      setSent(true);
      posthog.capture("magic_link_manual_resent", { email: email.trim() });
    } catch {
      setError("Something went wrong. Please try again.");
      posthog.capture("magic_link_resend_failed", { email: email.trim() });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="mx-auto w-48">
          <Logo />
        </div>
        <Card>
          <CardContent className="p-6 text-center">
            {isVerifying && !error && (
              <>
                <Loader2Icon className="mx-auto mb-3 size-8 animate-spin text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">
                  Logging you in...
                </h2>
                <p className="text-muted-foreground">
                  Hang tight, this will only take a second.
                </p>
              </>
            )}

            {error && !sent && (
              <>
                <h2 className="text-xl font-semibold mb-2">
                  Let&apos;s get you logged in
                </h2>
                <p className="text-muted-foreground mb-5">
                  This link is no longer active. Enter your email below and
                  we&apos;ll send you a new one right away.
                </p>
                <form onSubmit={handleSendLink} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button type="submit" className="w-full" disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2Icon className="mr-2 size-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MailIcon className="mr-2 size-4" />
                        Send me a login link
                      </>
                    )}
                  </Button>
                </form>
                <p className="mt-4 text-xs text-muted-foreground">
                  Need help?{" "}
                  <a href="mailto:info@spfarmsny.com" className="underline hover:text-foreground">
                    info@spfarmsny.com
                  </a>
                </p>
              </>
            )}

            {sent && (
              <>
                <CheckCircleIcon className="mx-auto mb-3 size-10 text-green-600" />
                <h2 className="text-xl font-semibold mb-2">New link sent!</h2>
                <p className="text-muted-foreground">
                  We just sent a fresh login link to <strong>{email}</strong>.
                  Check your inbox — you&apos;ll be logged in with one tap.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Need help?{" "}
                  <a href="mailto:info@spfarmsny.com" className="underline hover:text-foreground">
                    info@spfarmsny.com
                  </a>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
