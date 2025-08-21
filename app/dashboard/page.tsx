"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { UserDashboard } from "@/components/user-dashboard"
import { Loader2 } from "lucide-react"
import { LandingHero } from "@/components/landing-hero"

export default function DashboardPage() {
  const [registrationId, setRegistrationId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem("rocim_logged_in")
    const userId = localStorage.getItem("rocim_user_id")

    if (isLoggedIn && userId) {
      setRegistrationId(userId)
    } else {
      setRegistrationId(null)
    }
    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!registrationId) {
    return <LandingHero />
  }

  return <UserDashboard registrationId={registrationId} />
}
