"use client"
import { LoginForm } from "@/components/login-form"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const router = useRouter()

  const handleLoginSuccess = (registrationId: string) => {
    // Store login state in localStorage
    localStorage.setItem("rocim_logged_in", "true")
    localStorage.setItem("rocim_user_id", registrationId)

    // Redirect to dashboard
    router.push("/dashboard")
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />
}
