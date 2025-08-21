"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Shield, Smartphone, CheckCircle, XCircle, Copy, Phone } from "lucide-react"

interface MpesaPaymentProps {
  amount: number
  phoneNumber: string
  registrationId: string
  onSuccess: () => void
  onCancel: () => void
  registrationData: any
}

type PaymentStatus = "instructions" | "code-entry" | "verifying" | "success" | "failed"

export function MpesaPayment({
  amount,
  phoneNumber,
  registrationId,
  onSuccess,
  onCancel,
  registrationData,
}: MpesaPaymentProps) {
  const [mpesaCode, setMpesaCode] = useState("")
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("instructions")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const validateMpesaCode = (code: string): boolean => {
    const cleanCode = code.trim().toUpperCase()
    // Accept common Safaricom formats broadly: 8-12 alphanumeric
    return cleanCode.length >= 8 && cleanCode.length <= 12 && /^[A-Z0-9]+$/.test(cleanCode)
  }

  const handleCodeSubmit = async () => {
    if (!mpesaCode.trim()) {
      setError("Please enter your M-Pesa transaction code")
      return
    }

    if (!validateMpesaCode(mpesaCode)) {
      setError("Please enter a valid M-Pesa transaction code (8-10 characters, letters and numbers only)")
      return
    }

    setPaymentStatus("verifying")
    setError("")

    try {
      const response = await fetch("/api/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          registrationId,
          mpesaCode: mpesaCode.toUpperCase(),
        }),
      })

      const result = await response.json()

      if (result.success) {
        setPaymentStatus("success")
        setTimeout(() => {
          onSuccess()
        }, 2000)
      } else {
        setPaymentStatus("failed")
        setError(result.error || "Payment verification failed")
      }
    } catch (error) {
      console.error("Payment verification error:", error)
      setPaymentStatus("failed")
      setError("Network error. Please check your connection and try again.")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
          <Smartphone className="h-6 w-6" />
          M-Pesa Payment
        </CardTitle>
        <CardDescription>Complete your ROCIM registration with M-Pesa payment verification</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Payment Summary */}
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Amount to Pay:</span>
              <span className="font-bold text-lg text-primary">KSH {amount}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Pay to Number:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{phoneNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(phoneNumber)}
                  className="h-6 w-6 p-0"
                  title="Copy phone number"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                {copied && <span className="text-xs text-green-600">Copied!</span>}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span>Recipient Name:</span>
              <span className="font-semibold">RACHEL ADHIAMBO</span>
            </div>
            <div className="flex justify-between">
              <span>Registrant:</span>
              <span className="font-semibold">ROCIM</span>
            </div>
            <div className="flex justify-between">
              <span>Registration ID:</span>
              <span className="font-mono text-xs">{registrationId}</span>
            </div>
          </div>
        </div>

        {/* Payment Status Display */}
        {paymentStatus === "success" && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Payment Verified!</strong> Your registration has been completed successfully. Redirecting...
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === "failed" && (
          <Alert className="border-destructive bg-destructive/5">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              <strong>Verification Failed:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {paymentStatus === "verifying" && (
          <Alert className="border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <AlertDescription className="text-blue-800">
                <strong>Verifying Payment...</strong> Please wait while we confirm your M-Pesa transaction code.
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Payment Instructions */}
        {paymentStatus === "instructions" && (
          <>
            <Alert className="border-orange-200 bg-orange-50">
              <Phone className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <strong>Payment Instructions:</strong>
                <ol className="mt-2 ml-4 list-decimal space-y-1 text-sm">
                  <li>Go to M-Pesa on your phone</li>
                  <li>Select "Send Money" or "Lipa na M-Pesa"</li>
                  <li>
                    Enter the number: <strong>{phoneNumber}</strong> (RACHEL ADHIAMBO)
                  </li>
                  <li>
                    Enter amount: <strong>KSH {amount}</strong>
                  </li>
                  <li>Complete the transaction with your M-Pesa PIN</li>
                  <li>You will receive an M-Pesa confirmation message</li>
                  <li>Enter the transaction code from the message below</li>
                </ol>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <Button onClick={() => setPaymentStatus("code-entry")} className="w-full">
                I have completed the M-Pesa payment
              </Button>
            </div>
          </>
        )}

        {/* M-Pesa Code Entry */}
        {paymentStatus === "code-entry" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="mpesaCode">M-Pesa Transaction Code</Label>
              <Input
                id="mpesaCode"
                type="text"
                value={mpesaCode}
                onChange={(e) => {
                  setMpesaCode(e.target.value.toUpperCase())
                  if (error) setError("")
                }}
                placeholder="e.g., QH12345678 or RI87654321"
                className="text-center font-mono text-lg"
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground text-center">
                Enter the transaction code from your M-Pesa confirmation message (8-12 characters)
              </p>
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Where to find your transaction code:</strong>
                <p className="mt-1 text-sm">
                  Check your M-Pesa confirmation SMS. The transaction code is usually at the end of the message and
                  looks like "QH12345678", "RI87654321", or similar combinations of letters and numbers.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  <strong>Note:</strong> Each transaction code can only be used once to prevent fraud.
                </p>
              </AlertDescription>
            </Alert>
          </>
        )}

        {/* Security Notice */}
        <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="h-4 w-4 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-primary">Secure Verification</p>
              <p className="text-muted-foreground">
                We verify your payment using the official M-Pesa transaction code. Each code can only be used once to
                prevent fraud.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={paymentStatus === "verifying"}
            className="flex-1 bg-transparent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Form
          </Button>

          {paymentStatus === "code-entry" && (
            <Button onClick={handleCodeSubmit} disabled={!mpesaCode.trim()} className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Verify Payment
            </Button>
          )}

          {paymentStatus === "failed" && (
            <Button onClick={() => setPaymentStatus("code-entry")} className="flex-1">
              Try Again
            </Button>
          )}

          {paymentStatus === "instructions" && (
            <Button onClick={() => setPaymentStatus("code-entry")} variant="outline" className="flex-1">
              Skip to Code Entry
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
