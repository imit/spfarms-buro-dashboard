"use client";

import { useState, useEffect, useRef, type FormEvent } from "react"
import posthog from "posthog-js"
import { EyeIcon, EyeOffIcon, MailIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"
import { SUPPORT_EMAIL } from "@/lib/errors"

type LoginMode = "password" | "magic_link"

function getSavedEmail(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )spf_email=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function LoginForm() {
  const savedEmail = getSavedEmail()
  const [email, setEmail] = useState(savedEmail)
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
            className="bg-red-100 text-red-800 rounded-xl p-3 text-sm text-center relative group cursor-pointer"
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
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="h-14 rounded-xl border-0 bg-white text-base px-5 shadow-none"
            />

            {mode === "password" && (
              <>
                <div className="relative">
                  <Input
                    ref={passwordRef}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
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
    </div>
  )
}
