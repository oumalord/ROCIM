"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, LogIn, Mail, Home, Users } from "lucide-react"
import { useRouter } from "next/navigation"

interface RegistrationSuccessProps {
  registrationId: string
  email: string
  onStartOver: () => void
}

export function RegistrationSuccess({ registrationId, email, onStartOver }: RegistrationSuccessProps) {
  const router = useRouter()

  const handleSetupLogin = () => {
    router.push(`/setup-password?registrationId=${registrationId}`)
  }

  const handleContactSupport = () => {
    // Open email client or redirect to support
    window.location.href =
      "mailto:support@rocim.org?subject=Registration Support&body=Registration ID: " + registrationId
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <CardTitle className="text-2xl text-primary">Registration Successful!</CardTitle>
        <CardDescription>Welcome to the REVEALERS OF CHRIST INTERNATIONAL MINISTRY family</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Success Message */}
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Congratulations!</strong> Your registration has been completed successfully. Your payment has been
            confirmed and you are now an official member of ROCIM.
          </AlertDescription>
        </Alert>

        <Alert className="border-blue-200 bg-blue-50">
          <LogIn className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Next Step:</strong> Please set up your login password to access your member dashboard and register
            for missions.
          </AlertDescription>
        </Alert>

        {/* Registration Details */}
        <div className="bg-muted p-4 rounded-lg space-y-3">
          <h3 className="font-semibold text-foreground">Registration Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Registration ID:</span>
              <p className="font-mono font-semibold">{registrationId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Email:</span>
              <p className="font-semibold">{email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Registration Date:</span>
              <p className="font-semibold">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">What's Next?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <LogIn className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Set Up Your Login</h4>
                <p className="text-xs text-muted-foreground">
                  Create your password to access your member dashboard and register for missions.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Check Your Email</h4>
                <p className="text-xs text-muted-foreground">
                  A welcome email with ministry information has been sent to your email address.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Join Our Community</h4>
                <p className="text-xs text-muted-foreground">
                  Connect with other members through our WhatsApp group and social media channels.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Home className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-sm">Visit Our Ministry</h4>
                <p className="text-xs text-muted-foreground">
                  Join us for our weekly services and fellowship meetings. Details will be shared via email.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
          <h4 className="font-semibold text-primary mb-2">Ministry Contact Information</h4>
          <div className="space-y-1 text-sm">
            <p>
              <strong>Phone:</strong> +254 703 877 167 (RACHEL ADHIAMBO)
            </p>
            <p>
              <strong>Email:</strong> info@rocim.org
            </p>
            <p>
              <strong>Address:</strong> ROCIM Headquarters, Nairobi, Kenya
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSetupLogin} className="flex-1">
            <LogIn className="mr-2 h-4 w-4" />
            Set Up Login Password
          </Button>

          <Button onClick={handleContactSupport} variant="outline" className="flex-1 bg-transparent">
            <Mail className="mr-2 h-4 w-4" />
            Contact Support
          </Button>

          <Button onClick={onStartOver} variant="outline" className="flex-1 bg-transparent">
            <Users className="mr-2 h-4 w-4" />
            Register Another Member
          </Button>
        </div>

        {/* Important Note */}
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Important:</strong> Please save your Registration ID ({registrationId}) for future reference. You
            will use this ID along with your password to log into your member dashboard.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
