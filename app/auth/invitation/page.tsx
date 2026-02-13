"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";

export default function AcceptInvitationPage() {
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
      <AcceptInvitationContent />
    </Suspense>
  );
}

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(
    token ? null : "No invitation token provided."
  );
  const [isAccepting, setIsAccepting] = useState(!!token);

  useEffect(() => {
    if (!token) return;

    const accept = async () => {
      try {
        const { user } = await apiClient.acceptInvitation(token);
        loginWithToken(user);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to accept invitation. The link may have expired."
        );
        setIsAccepting(false);
      }
    };

    accept();
  }, [token, loginWithToken]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {isAccepting && !error && (
            <>
              <h2 className="text-xl font-semibold mb-2">
                Accepting your invitation...
              </h2>
              <p className="text-muted-foreground">
                Please wait while we set up your account.
              </p>
            </>
          )}
          {error && (
            <>
              <h2 className="text-xl font-semibold mb-2 text-destructive">
                Invitation Failed
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
