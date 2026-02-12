"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";

export default function VerifyMagicLinkPage() {
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
            : "Verification failed. The link may have expired."
        );
        setIsVerifying(false);
      }
    };

    verify();
  }, [token, loginWithToken]);

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
          {error && (
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
