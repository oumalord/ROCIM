import { type NextRequest, NextResponse } from "next/server"
import { PaymentVerificationService } from "@/lib/payment-store"

export async function POST(request: NextRequest) {
  try {
    const callbackData = await request.json()

    console.log("Instasend Callback received:", JSON.stringify(callbackData, null, 2))

    // Extract payment details from Instasend callback
    const { invoice_id, api_ref, state, charges, net_amount, currency, value, account, failed_reason } = callbackData

    if (state === "COMPLETE") {
      // Payment successful
      const paymentDetails = {
        invoiceId: invoice_id,
        apiRef: api_ref,
        state: state,
        amount: net_amount || value,
        currency: currency,
        account: account,
        charges: charges,
      }

      console.log("Payment successful:", paymentDetails)

      const updated = PaymentVerificationService.updatePaymentFromCallback({
        checkoutRequestId: invoice_id,
        merchantRequestId: api_ref,
        resultCode: 0,
        resultDesc: "Payment completed successfully",
        mpesaReceiptNumber: invoice_id, // Use invoice_id as receipt reference
        transactionDate: new Date().toISOString(),
        amount: net_amount || value,
        phoneNumber: account,
      })

      if (updated) {
        console.log("Payment verification completed successfully")
      } else {
        console.error("Failed to update payment record")
      }
    } else if (state === "FAILED") {
      // Payment failed
      console.log("Payment failed:", { invoice_id, api_ref, state, failed_reason })

      PaymentVerificationService.updatePaymentFromCallback({
        checkoutRequestId: invoice_id,
        merchantRequestId: api_ref,
        resultCode: 1,
        resultDesc: failed_reason || "Payment failed",
      })
    }

    // Always return success to Instasend to acknowledge receipt
    return NextResponse.json({ status: "received" })
  } catch (error) {
    console.error("Instasend Callback Error:", error)
    return NextResponse.json({ status: "error", message: "Error processing callback" })
  }
}
