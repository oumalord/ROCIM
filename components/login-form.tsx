"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, LogIn, Eye, EyeOff } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface LoginFormProps {
  onLoginSuccess: (registrationId: string) => void
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [registrationId, setRegistrationId] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!registrationId.trim() || !password.trim()) {
      setError("Please enter both Registration ID and Password")
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId: registrationId.trim(),
          password: password.trim(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        onLoginSuccess(registrationId.trim())
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-8">
          <div className="flex flex-col items-center space-y-6 mb-2">
            <div className="relative">
              <Image
                src="/images/rocim-logo.png"
                alt="REVEALERS OF CHRIST INTERNATIONAL MINISTRIES Logo"
                width={100}
                height={100}
                className="object-contain drop-shadow-lg"
                priority
              />
            </div>

            <div className="text-center space-y-2">
              <h1 className="text-xl font-bold text-gray-900 tracking-wide">REVEALERS OF CHRIST</h1>
              <h2 className="text-lg font-semibold text-orange-600 tracking-widest">INTERNATIONAL MINISTRIES</h2>
              <div className="w-20 h-0.5 bg-gradient-to-r from-orange-400 to-orange-600 mx-auto mt-3"></div>
            </div>
          </div>

          <CardTitle className="text-2xl text-primary mt-6">Member Login</CardTitle>
          <CardDescription className="text-base">
            Access your account with your Registration ID and Password
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="registrationId">Registration ID</Label>
              <Input
                id="registrationId"
                type="text"
                placeholder="ROCIM/CAM/2025/001"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                className="font-mono"
                required
              />
              <p className="text-xs text-muted-foreground">Format: ROCIM/UNIT/YEAR/NUMBER (e.g., ROCIM/CAM/2025/001)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Default: firstname + last 4 digits of phone (e.g., john5678)
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Don't have an account?</p>
            <Link href="/register">
              <Button variant="outline" className="w-full bg-transparent">
                Register for ROCIM
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
