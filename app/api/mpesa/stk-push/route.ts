import { type NextRequest, NextResponse } from "next/server"
import { PaymentVerificationService } from "@/lib/payment-store"

const INSTASEND_API_URL = "https://sandbox.intasend.com/api/v1/payment/mpesa-stk-push/"
const INSTASEND_API_KEY = process.env.INSTASEND_API_KEY || ""

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc, registrationData } = await request.json()

    // Validate input
    if (!phoneNumber || !amount || !registrationData) {
      return NextResponse.json({ error: "Phone number, amount, and registration data are required" }, { status: 400 })
    }

    // Format phone number for Instasend (should be in format 254XXXXXXXXX)
    let formattedPhone = phoneNumber.replace(/^\+/, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1)
    }
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone
    }

    // Prepare Instasend STK push request
    const instasendData = {
      phone_number: formattedPhone,
      email: registrationData.email || "member@rocim.org",
      amount: amount,
      narrative: transactionDesc || "ROCIM Ministry Registration Fee",
      api_ref: accountReference || `ROCIM-${Date.now()}`,
    }

    // Send STK push request to Instasend
    const response = await fetch(INSTASEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${INSTASEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(instasendData),
    })

    const result = await response.json()

    if (response.ok && result.invoice) {
      const paymentId = PaymentVerificationService.createPayment({
        checkoutRequestId: result.invoice.invoice_id,
        merchantRequestId: result.invoice.api_ref,
        phoneNumber: formattedPhone,
        amount: amount,
        registrationData: registrationData,
        instasendInvoiceId: result.invoice.invoice_id,
      })

      return NextResponse.json({
        success: true,
        message: "STK push sent successfully",
        checkoutRequestId: result.invoice.invoice_id,
        merchantRequestId: result.invoice.api_ref,
        paymentId: paymentId,
        invoiceId: result.invoice.invoice_id,
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.detail || result.message || "STK push failed",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Instasend STK Push Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
