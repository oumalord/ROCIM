import { type NextRequest, NextResponse } from "next/server"
import { rocimDB } from "@/lib/database"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { verifyPayment as verifyPaymentSupabase } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, mpesaCode } = body

    if (!registrationId || !mpesaCode) {
      return NextResponse.json(
        { success: false, error: "Registration ID and M-Pesa code are required" },
        { status: 400 },
      )
    }

    if (isSupabaseConfigured) {
      const result = await verifyPaymentSupabase(registrationId, mpesaCode)
      if (!result.success) {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
      return NextResponse.json({ success: true })
    } else {
      // Validate registration exists
      const registration = await rocimDB.getRegistration(registrationId)
      if (!registration) {
        return NextResponse.json({ success: false, error: "Registration not found" }, { status: 404 })
      }

      // Validate M-Pesa code format and uniqueness
      const validation = await rocimDB.validateMpesaCode(mpesaCode)
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.message }, { status: 400 })
      }

      // Check if payment already exists for this registration
      const existingPayment = await rocimDB.getPaymentByRegistrationId(registrationId)
      if (existingPayment) {
        return NextResponse.json(
          { success: false, error: "Payment already exists for this registration" },
          { status: 409 },
        )
      }

      // Create payment record
      const payment = await rocimDB.createPayment({
        registrationId,
        mpesaCode: mpesaCode.toUpperCase(),
        amount: 200,
        phoneNumber: "0703877167",
        status: "verified",
        verifiedAt: new Date(),
      })

      return NextResponse.json({ success: true, data: { payment, registration } })
    }
  } catch (error) {
    console.error("Payment verification error:", error)

    if (error instanceof Error && error.message.includes("already been used")) {
      return NextResponse.json({ success: false, error: error.message }, { status: 409 })
    }

    return NextResponse.json({ success: false, error: "Failed to verify payment" }, { status: 500 })
  }
}
