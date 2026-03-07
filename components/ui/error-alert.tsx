import { cn } from "@/lib/utils";
import { SUPPORT_EMAIL } from "@/lib/errors";

export function ErrorAlert({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("bg-destructive/10 text-destructive rounded-md p-3 text-sm", className)}>
      <p>{message}</p>
      <p className="mt-1.5 text-xs opacity-70">
        Need help? Reach out to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="underline">
          {SUPPORT_EMAIL}
        </a>
      </p>
    </div>
  );
}
