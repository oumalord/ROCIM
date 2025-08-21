import { RegistrationForm } from "@/components/registration-form"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <RegistrationForm />
        </div>
      </div>
    </div>
  )
}
