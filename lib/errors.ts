import { toast } from "sonner";

export const SUPPORT_EMAIL = "info@spfarmsny.com";

/**
 * Show a friendly error toast with support contact info.
 */
export function showError(action: string, err?: unknown) {
  const apiMsg = err instanceof Error ? err.message : null;
  const message = apiMsg || `We couldn't ${action}`;
  toast.error(message, {
    description: `Need help? Reach out to ${SUPPORT_EMAIL}`,
  });
}

/**
 * Format an error for inline display (setError).
 */
export function formatError(action: string, err?: unknown): string {
  const apiMsg = err instanceof Error ? err.message : null;
  return apiMsg || `We couldn't ${action}. Please try again or contact ${SUPPORT_EMAIL} for help.`;
}
