import { type NextRequest, NextResponse } from "next/server"
import { PaymentVerificationService } from "@/lib/payment-store"

const INSTASEND_API_URL = "https://sandbox.intasend.com/api/v1/payment/status/"
const INSTASEND_API_KEY = process.env.INSTASEND_API_KEY || ""

export async function POST(request: NextRequest) {
  try {
    const { checkoutRequestId, invoiceId } = await request.json()

    const paymentId = checkoutRequestId || invoiceId
    if (!paymentId) {
      return NextResponse.json({ error: "CheckoutRequestID or InvoiceID is required" }, { status: 400 })
    }

    // Check local payment record first
    const localPayment = PaymentVerificationService.getPaymentByCheckoutId(paymentId)
    if (localPayment && localPayment.status === "completed") {
      return NextResponse.json({
        success: true,
        data: {
          ResultCode: "0",
          ResultDesc: "The service request is processed successfully.",
          CheckoutRequestID: paymentId,
          MerchantRequestID: localPayment.merchantRequestId,
        },
        paymentRecord: {
          status: localPayment.status,
          mpesaReceiptNumber: localPayment.mpesaReceiptNumber,
          amount: localPayment.amount,
        },
      })
    }

    // Query Instasend for payment status
    const queryResponse = await fetch(`${INSTASEND_API_URL}${paymentId}/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${INSTASEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    })

    const queryResult = await queryResponse.json()

    if (queryResponse.ok && queryResult.state === "COMPLETE" && localPayment) {
      PaymentVerificationService.updatePaymentFromCallback({
        checkoutRequestId: paymentId,
        merchantRequestId: localPayment.merchantRequestId,
        resultCode: 0,
        resultDesc: "Payment completed successfully",
        mpesaReceiptNumber: queryResult.invoice_id,
        transactionDate: queryResult.created_at,
        amount: queryResult.net_amount || queryResult.value,
        phoneNumber: queryResult.account,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ResultCode: queryResult.state === "COMPLETE" ? "0" : "1",
        ResultDesc:
          queryResult.state === "COMPLETE" ? "Payment completed" : queryResult.failed_reason || "Payment pending",
        CheckoutRequestID: paymentId,
        InstasendData: queryResult,
      },
      paymentRecord: localPayment
        ? {
            status: localPayment.status,
            mpesaReceiptNumber: localPayment.mpesaReceiptNumber,
            amount: localPayment.amount,
          }
        : null,
    })
  } catch (error) {
    console.error("Instasend Query Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}
