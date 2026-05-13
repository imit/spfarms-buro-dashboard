"use client";

import { useState, useEffect, useRef, type FormEvent } from "react"
import Link from "next/link"
import posthog from "posthog-js"
import { ArrowRightIcon, EyeIcon, EyeOffIcon, MailIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { SUPPORT_EMAIL } from "@/lib/errors"

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

      <h1 className="text-4xl font-light tracking-tight text-[#050403] mb-10">
        {savedEmail ? "Welcome back" : "Welcome friend"}
      </h1>

      <form
        onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicLinkSubmit}
        className="w-full flex flex-col gap-4"
      >
        {error && (
          <button
            type="button"
            onClick={() => setError("")}
            className="bg-[#03602E]/10 text-[#03602E] rounded-xl p-3 text-sm text-center relative group cursor-pointer"
          >
            <XIcon className="absolute top-2.5 right-2.5 size-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            <p>{error}</p>
            <p className="mt-1 text-xs opacity-70">Need help? Contact {SUPPORT_EMAIL}</p>
          </button>
        )}

        {success ? (
          <div className="bg-green-50 text-green-800 rounded-xl p-6 text-center space-y-3">
            <MailIcon className="size-10 mx-auto text-green-600" />
            <p className="text-lg font-medium">Check your inbox</p>
            <p className="text-sm text-green-700">
              We sent a login link to <span className="font-medium">{email}</span>. Click the link in the email to sign in.
            </p>
            <button
              type="button"
              onClick={() => { setSuccess(""); }}
              className="text-sm text-green-600 underline hover:text-green-800 mt-2"
            >
              Try again
            </button>
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
              className="h-14 rounded-xl border-0 bg-white text-base px-5 shadow-none"
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
                    className="h-14 rounded-xl border-0 bg-white text-base px-5 pr-12 shadow-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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
              disabled={isLoading}
              className="w-full h-14 rounded-xl text-lg font-medium mt-2"
              style={{ backgroundColor: "#48A848" }}
            >
              {isLoading
                ? (mode === "magic_link" ? "Sending link..." : "Logging in...")
                : (mode === "magic_link" ? "Send login link" : "Login")}
            </Button>

            <div className="text-center mt-2">
              <button
                type="button"
                onClick={toggleMode}
                className="text-sm text-[#050403]/50 hover:text-[#050403] transition-colors"
              >
                {mode === "magic_link"
                  ? <>Have a password? <span className="underline font-medium">Login with password</span></>
                  : <>Back to <span className="underline font-medium">magic link login</span></>}
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
