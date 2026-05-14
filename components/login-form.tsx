"use client";

import { useState, useEffect, useRef, type FormEvent } from "react"
import Link from "next/link"
import posthog from "posthog-js"
import {
  AlertCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
  ExternalLinkIcon,
  MailIcon,
  XIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { SUPPORT_EMAIL } from "@/lib/errors"

/** Quick-jump links shown in the magic-link success card so users don't have
 *  to hunt for their inbox. Only the providers that cover ~95% of mail. */
function inboxLinkFor(email: string): { label: string; href: string } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (/^(gmail|googlemail)\.com$/.test(domain)) {
    return { label: "Open Gmail", href: "https://mail.google.com" };
  }
  if (/^(outlook|hotmail|live|msn)\./.test(domain) || domain === "outlook.com") {
    return { label: "Open Outlook", href: "https://outlook.live.com/mail" };
  }
  if (/^(yahoo|ymail)\./.test(domain)) {
    return { label: "Open Yahoo Mail", href: "https://mail.yahoo.com" };
  }
  if (/^icloud\.com$/.test(domain) || /^me\.com$/.test(domain)) {
    return { label: "Open iCloud Mail", href: "https://www.icloud.com/mail" };
  }
  return null;
}

type LoginMode = "password" | "magic_link"

function readSavedEmailCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )spf_email=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function LoginForm() {
  // `savedEmail` MUST be state, not a value computed during render. Reading
  // `document.cookie` directly in the render body produces different output
  // on the server (no document → "") vs the client (cookie present), which
  // crashes React 19 with a hydration mismatch. We initialize empty and
  // populate from the cookie in the mount effect — first paint matches
  // server, post-hydration the form upgrades to "welcome back" mode.
  const [savedEmail, setSavedEmail] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<LoginMode>("magic_link")
  const [mounted, setMounted] = useState(false)
  const { login } = useAuth()

  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    const saved = readSavedEmailCookie()
    if (saved) {
      setSavedEmail(saved)
      setEmail(saved)
    }
  }, [])

  // Auto-focus: password if in password mode with saved email, email otherwise
  useEffect(() => {
    if (!mounted) return
    if (savedEmail && mode === "password") {
      passwordRef.current?.focus()
    } else {
      emailRef.current?.focus()
    }
  }, [mounted, mode, savedEmail])

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't log you in"
      setError(message)
      posthog.capture("login_failed", { method: "password", error: message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleMagicLinkSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    try {
      const result = await apiClient.requestMagicLink(email)
      setSuccess(result.message)
      posthog.capture("magic_link_requested", { source: "login_page" })
    } catch (err) {
      const message = err instanceof Error ? err.message : "We couldn't send the login link"
      setError(message)
      posthog.capture("login_failed", { method: "magic_link", error: message })
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "password" ? "magic_link" : "password")
    setError("")
    setSuccess("")
  }

  return (
    <div
      className={`flex flex-col items-center w-full max-w-sm transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/panda-symbol.svg" alt="SPFarms" className="w-20 h-auto mb-6" />

      <h1 className="text-4xl font-light tracking-tight text-[#050403] mb-2">
        {savedEmail ? "Welcome back" : "Welcome friend"}
      </h1>
      <p className="text-sm text-[#050403]/60 mb-10 text-center max-w-xs">
        {mode === "magic_link"
          ? "We'll email you a one-tap login link — no password needed."
          : "Sign in with your password."}
      </p>

      <form
        onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicLinkSubmit}
        className="w-full flex flex-col gap-4"
      >
        {error && (
          <div
            role="alert"
            className="relative flex items-start gap-3 rounded-xl bg-red-50 px-4 py-3 pr-9 text-sm text-red-900"
          >
            <AlertCircleIcon
              className="mt-0.5 size-4 shrink-0 text-red-600"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <div className="flex-1 text-left">
              <p>{error}</p>
              <p className="mt-1 text-xs text-red-700/70">
                Need help?{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="underline underline-offset-2"
                >
                  {SUPPORT_EMAIL}
                </a>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
              className="absolute right-2.5 top-2.5 text-red-700/60 hover:text-red-900 transition-colors"
            >
              <XIcon className="size-4" />
            </button>
          </div>
        )}

        {success ? (
          <div className="rounded-xl bg-green-50 p-6 text-center text-green-800 space-y-3">
            <MailIcon className="size-10 mx-auto text-green-600" />
            <p className="text-lg font-medium">Check your inbox</p>
            <p className="text-sm text-green-700">
              We sent a login link to{" "}
              <span className="font-medium break-all">{email}</span>. The link
              works for 15 minutes — open it on this device for the best
              experience.
            </p>

            {/* Quick-jump to a recognized inbox provider, when we can guess one */}
            {(() => {
              const inbox = inboxLinkFor(email);
              if (!inbox) return null;
              return (
                <a
                  href={inbox.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() =>
                    posthog.capture("login_inbox_link_clicked", {
                      provider: inbox.label,
                    })
                  }
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-green-800 underline underline-offset-2 hover:text-green-900"
                >
                  {inbox.label}
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              );
            })()}

            <div className="pt-1">
              <button
                type="button"
                onClick={() => { setSuccess(""); }}
                className="text-xs text-green-700/70 underline underline-offset-2 hover:text-green-900"
              >
                Use a different email
              </button>
            </div>
          </div>
        ) : (
          <>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="email"
              className="h-14 rounded-xl border-0 bg-white text-base px-5 shadow-none focus-visible:ring-2 focus-visible:ring-[#48A848]/40 focus-visible:ring-offset-0"
            />

            {mode === "password" && (
              <>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                    className="h-14 rounded-xl border-0 bg-white text-base px-5 pr-12 shadow-none focus-visible:ring-2 focus-visible:ring-[#48A848]/40 focus-visible:ring-offset-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#050403]/30 hover:text-[#050403]/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOffIcon className="size-5" /> : <EyeIcon className="size-5" />}
                  </button>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full h-14 rounded-xl text-lg font-medium mt-2 transition-[background-color,transform] active:scale-[0.99] hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#48A848" }}
            >
              {isLoading
                ? (mode === "magic_link" ? "Sending link…" : "Logging in…")
                : (mode === "magic_link" ? "Send login link" : "Login")}
            </Button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-[#050403]/50 hover:text-[#050403] transition-colors"
              >
                {mode === "magic_link"
                  ? <>Have a password? <span className="underline font-medium">Sign in with password</span></>
                  : <>Prefer a magic link? <span className="underline font-medium">Email me a link</span></>}
              </button>
            </div>
          </>
        )}
      </form>

      {/* Wholesale registration CTA — always shown alongside login (except
          inside the magic-link success card, which is its own focused state).
          The previous `!savedEmail` gate was wrong: the `spf_email` cookie
          stores the last email typed, not whether the user has an account,
          so a returning visitor with no SPFarms account would never see it. */}
      {!success && (
        <div className="w-full mt-10">
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-[#050403]/40">
            <span className="h-px flex-1 bg-[#050403]/15" />
            <span>New here?</span>
            <span className="h-px flex-1 bg-[#050403]/15" />
          </div>
          <Link
            href="/wholesale/register"
            onClick={() =>
              posthog.capture("login_to_wholesale_register_clicked")
            }
            className="group mt-4 flex items-center justify-between rounded-xl bg-white/70 hover:bg-white px-5 py-4 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-medium text-[#050403]">
                Apply to be a wholesale partner
              </p>
              <p className="text-xs text-[#050403]/60 mt-0.5">
                Carry SPFarms in your dispensary.
              </p>
            </div>
            <ArrowRightIcon className="size-4 text-[#050403]/50 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      )}
    </div>
  )
}
