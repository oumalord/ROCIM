import { type NextRequest, NextResponse } from "next/server"
import { PaymentVerificationService } from "@/lib/payment-store"

// Get payment statistics and records (for admin dashboard)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")

    switch (action) {
      case "stats":
        const stats = PaymentVerificationService.getPaymentStats()
        return NextResponse.json({ success: true, data: stats })

      case "pending":
        const pendingPayments = PaymentVerificationService.getPendingPayments()
        return NextResponse.json({ success: true, data: pendingPayments })

      case "completed":
        const completedRegistrations = PaymentVerificationService.getCompletedRegistrations()
        return NextResponse.json({ success: true, data: completedRegistrations })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Admin API Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// Manual payment verification (for admin use)
export async function POST(request: NextRequest) {
  try {
    const { paymentId, mpesaReceiptNumber, action } = await request.json()

    if (action === "verify" && paymentId && mpesaReceiptNumber) {
      const verified = PaymentVerificationService.manuallyVerifyPayment(paymentId, mpesaReceiptNumber)

      if (verified) {
        return NextResponse.json({
          success: true,
          message: "Payment verified and registration completed",
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: "Failed to verify payment",
          },
          { status: 400 },
        )
      }
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Admin Verification Error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
