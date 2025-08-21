import { type NextRequest, NextResponse } from "next/server"
import { PaymentVerificationService } from "@/lib/payment-store"

// Complete registration after successful payment
export async function POST(request: NextRequest) {
  try {
    const { registrationId, paymentId } = await request.json()

    if (!registrationId || !paymentId) {
      return NextResponse.json({ error: "Registration ID and Payment ID are required" }, { status: 400 })
    }

    // Get payment record to verify it's completed
    const payment = PaymentVerificationService.getPayment(paymentId)
    if (!payment || payment.status !== "completed") {
      return NextResponse.json({ error: "Payment not found or not completed" }, { status: 400 })
    }

    // Get registration record
    const registration = PaymentVerificationService.getRegistrationByPaymentId(paymentId)
    if (!registration) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 })
    }

    // In a real implementation, you would:
    // 1. Send welcome email with ministry information
    // 2. Generate membership certificate PDF
    // 3. Add member to ministry database
    // 4. Send SMS confirmation
    // 5. Add to WhatsApp group (if applicable)
    // 6. Create member profile in ministry system

    // Simulate email sending
    console.log("Sending welcome email to:", registration.email)
    console.log("Registration completed for:", registration.firstName, registration.lastName)

    return NextResponse.json({
      success: true,
      message: "Registration completed successfully",
      registrationId: registration.id,
      memberName: `${registration.firstName} ${registration.lastName}`,
      email: registration.email,
    })
  } catch (error) {
    console.error("Registration completion error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
