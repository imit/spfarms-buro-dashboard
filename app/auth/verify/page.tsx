"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MailIcon } from "lucide-react";
import { Logo } from "@/components/shared/logo";

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

  useEffect(() => {
    if (!token) return;

    const verify = async () => {
      try {
        const { user } = await apiClient.verifyMagicLink(token);
        loginWithToken(user);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "This link is invalid or has already been used."
        );
        setIsVerifying(false);
      }
    };

    verify();
  }, [token, loginWithToken]);

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
                <h2 className="text-xl font-semibold mb-2">
                  Verifying your login...
                </h2>
                <p className="text-muted-foreground">
                  Please wait while we log you in.
                </p>
              </>
            )}

            {error && (
              <>
                <h2 className="text-xl font-semibold mb-2">
                  Link Already Used
                </h2>
                <p className="text-muted-foreground mb-5">
                  Looks like this link was already used. No worries — just
                  request a fresh one and you&apos;ll be in!
                </p>
                <Link href="/">
                  <Button>
                    <MailIcon className="mr-2 size-4" />
                    Get a New Link
                  </Button>
                </Link>
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
