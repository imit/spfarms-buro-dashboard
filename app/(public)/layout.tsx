import { Suspense } from "react";
import { PublicHeader } from "@/components/public/public-header";
import { PublicFooter } from "@/components/public/public-footer";
import { PostHogPageTracker } from "@/components/public/posthog-page-tracker";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#FFFBF9", color: "#431F13" }}>
      <Suspense>
        <PostHogPageTracker section="public" />
      </Suspense>
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
