"use client";

import { useState, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

type LoginMode = "password" | "magic_link"

function getSavedEmail(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )spf_email=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export function LoginForm() {
  const [email, setEmail] = useState(getSavedEmail)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<LoginMode>("password")
  const { login } = useAuth()

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send login link")
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
    <div className="flex flex-col items-center w-full max-w-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/panda-symbol.svg" alt="SPFarms" className="w-20 h-auto mb-6" />

      <h1 className="text-4xl font-light tracking-tight text-[#050403] mb-10">
        Welcome friend
      </h1>

      <form
        onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicLinkSubmit}
        className="w-full flex flex-col gap-4"
      >
        {error && (
          <div className="bg-red-100 text-red-800 rounded-xl p-3 text-sm text-center">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 text-green-800 rounded-xl p-3 text-sm text-center">
            {success}
          </div>
        )}

        <Input
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
          <Input
            id="password"
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
            className="h-14 rounded-xl border-0 bg-white text-base px-5 shadow-none"
          />
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-14 rounded-xl text-lg font-medium mt-2"
          style={{ backgroundColor: "#48A848" }}
        >
          {isLoading
            ? (mode === "password" ? "Logging in..." : "Sending link...")
            : (mode === "password" ? "Login" : "Send login link")}
        </Button>

        <div className="text-center mt-2">
          <button
            type="button"
            onClick={toggleMode}
            className="text-sm text-[#050403]/60 underline hover:text-[#050403]"
          >
            {mode === "password"
              ? "Login with a magic link instead"
              : "Login with password instead"}
          </button>
        </div>
      </form>
    </div>
  )
}
