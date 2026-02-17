"use client";

import { useState, FormEvent } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { apiClient } from "@/lib/api"

type LoginMode = "password" | "magic_link"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
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
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form
            onSubmit={mode === "password" ? handlePasswordSubmit : handleMagicLinkSubmit}
            className="p-6 md:p-8"
          >
            <FieldGroup>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your SPFarms New York account
                </p>
              </div>
              {error && (
                <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200 rounded-md p-3 text-sm">
                  {success}
                </div>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              {mode === "password" && (
                <Field>
                  <div className="flex items-center">
                    <FieldLabel htmlFor="password">Password</FieldLabel>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </Field>
              )}
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading
                    ? (mode === "password" ? "Logging in..." : "Sending link...")
                    : (mode === "password" ? "Login" : "Send login link")}
                </Button>
              </Field>
              <div className="text-center">
                <button
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  {mode === "password"
                    ? "Login with a magic link instead"
                    : "Login with password instead"}
                </button>
              </div>
            </FieldGroup>
          </form>
          <div className="bg-muted relative hidden md:block">
            <img
              src="/placeholder.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
