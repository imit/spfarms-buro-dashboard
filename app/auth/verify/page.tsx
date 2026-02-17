"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient, type MagicLinkError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailIcon, Loader2Icon } from "lucide-react";

export default function VerifyMagicLinkPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh flex-col items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold mb-2">Loading...</h2>
            </CardContent>
          </Card>
        </div>
      }
    >
      <VerifyMagicLinkContent />
    </Suspense>
  );
}

function VerifyMagicLinkContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(
    token ? null : "No token provided."
  );
  const [isVerifying, setIsVerifying] = useState(!!token);
  const [isExpired, setIsExpired] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { user } = await apiClient.verifyMagicLink(token);
        loginWithToken(user);
      } catch (err) {
        const magicErr = err as MagicLinkError;
        if (magicErr.expired) {
          setIsExpired(true);
          setError("This link has expired.");
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Verification failed. The link may have expired."
          );
        }
        setIsVerifying(false);
      }
    };

    verify();
  }, [token, loginWithToken]);

  async function handleResend() {
    if (!token) return;
    setIsResending(true);
    try {
      await apiClient.refreshMagicLink(token);
      setResent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send a new link."
      );
      setIsExpired(false);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {isVerifying && !error && (
            <>
              <h2 className="text-xl font-semibold mb-2">
                Verifying your login...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we log you in.
              </p>
            </>
          )}

          {resent && (
            <>
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-green-100">
                <MailIcon className="size-6 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">New link sent!</h2>
              <p className="text-muted-foreground">
                We&apos;ve sent a fresh login link to your email. Please check
                your inbox.
              </p>
            </>
          )}

          {error && !resent && isExpired && (
            <>
              <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
              <p className="text-muted-foreground mb-5">
                This login link has expired. Click below to receive a new one.
              </p>
              <Button onClick={handleResend} disabled={isResending}>
                {isResending ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MailIcon className="mr-2 size-4" />
                    Send me a new link
                  </>
                )}
              </Button>
            </>
          )}

          {error && !resent && !isExpired && (
            <>
              <h2 className="text-xl font-semibold mb-2 text-destructive">
                Verification Failed
              </h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Link
                href="/"
                className="text-sm underline hover:text-foreground"
              >
                Return to login
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
