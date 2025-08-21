// Simple in-memory storage for payment verification
// In production, replace with a proper database like Supabase, MongoDB, or PostgreSQL

interface PaymentRecord {
  id: string
  checkoutRequestId: string
  merchantRequestId: string
  phoneNumber: string
  amount: number
  status: "pending" | "completed" | "failed" | "cancelled"
  mpesaReceiptNumber?: string
  transactionDate?: string
  registrationData: any
  createdAt: Date
  updatedAt: Date
}

interface RegistrationRecord {
  id: string
  paymentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: "pending" | "completed" | "verified"
  registrationData: any
  createdAt: Date
  completedAt?: Date
}

// In-memory stores (replace with database in production)
const paymentStore = new Map<string, PaymentRecord>()
const registrationStore = new Map<string, RegistrationRecord>()
const checkoutRequestMap = new Map<string, string>() // Maps checkoutRequestId to paymentId

export class PaymentVerificationService {
  // Create a new payment record
  static createPayment(data: {
    checkoutRequestId: string
    merchantRequestId: string
    phoneNumber: string
    amount: number
    registrationData: any
  }): string {
    const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const payment: PaymentRecord = {
      id: paymentId,
      checkoutRequestId: data.checkoutRequestId,
      merchantRequestId: data.merchantRequestId,
      phoneNumber: data.phoneNumber,
      amount: data.amount,
      status: "pending",
      registrationData: data.registrationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    paymentStore.set(paymentId, payment)
    checkoutRequestMap.set(data.checkoutRequestId, paymentId)

    // Create corresponding registration record
    const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const registration: RegistrationRecord = {
      id: registrationId,
      paymentId: paymentId,
      firstName: data.registrationData.firstName,
      lastName: data.registrationData.lastName,
      email: data.registrationData.email,
      phone: data.registrationData.phone,
      status: "pending",
      registrationData: data.registrationData,
      createdAt: new Date(),
    }

    registrationStore.set(registrationId, registration)

    return paymentId
  }

  // Update payment status from M-Pesa callback
  static updatePaymentFromCallback(data: {
    checkoutRequestId: string
    merchantRequestId: string
    resultCode: number
    resultDesc: string
    mpesaReceiptNumber?: string
    transactionDate?: string
    amount?: number
    phoneNumber?: string
  }): boolean {
    const paymentId = checkoutRequestMap.get(data.checkoutRequestId)
    if (!paymentId) {
      console.error("Payment not found for checkoutRequestId:", data.checkoutRequestId)
      return false
    }

    const payment = paymentStore.get(paymentId)
    if (!payment) {
      console.error("Payment record not found:", paymentId)
      return false
    }

    // Update payment status based on result code
    if (data.resultCode === 0) {
      payment.status = "completed"
      payment.mpesaReceiptNumber = data.mpesaReceiptNumber
      payment.transactionDate = data.transactionDate

      // Complete the registration
      this.completeRegistration(paymentId)
    } else {
      payment.status = "failed"
    }

    payment.updatedAt = new Date()
    paymentStore.set(paymentId, payment)

    return true
  }

  // Complete registration after successful payment
  static completeRegistration(paymentId: string): boolean {
    // Find registration by payment ID
    for (const [regId, registration] of registrationStore.entries()) {
      if (registration.paymentId === paymentId) {
        registration.status = "completed"
        registration.completedAt = new Date()
        registrationStore.set(regId, registration)

        console.log("Registration completed:", {
          registrationId: regId,
          paymentId: paymentId,
          member: `${registration.firstName} ${registration.lastName}`,
          email: registration.email,
        })

        // Here you would typically:
        // 1. Send welcome email
        // 2. Add to ministry database
        // 3. Generate membership ID
        // 4. Send SMS confirmation

        return true
      }
    }

    return false
  }

  // Get payment by checkout request ID
  static getPaymentByCheckoutId(checkoutRequestId: string): PaymentRecord | null {
    const paymentId = checkoutRequestMap.get(checkoutRequestId)
    if (!paymentId) return null

    return paymentStore.get(paymentId) || null
  }

  // Get payment by ID
  static getPayment(paymentId: string): PaymentRecord | null {
    return paymentStore.get(paymentId) || null
  }

  // Get registration by payment ID
  static getRegistrationByPaymentId(paymentId: string): RegistrationRecord | null {
    for (const registration of registrationStore.values()) {
      if (registration.paymentId === paymentId) {
        return registration
      }
    }
    return null
  }

  // Get all pending payments (for admin verification)
  static getPendingPayments(): PaymentRecord[] {
    return Array.from(paymentStore.values()).filter((p) => p.status === "pending")
  }

  // Get all completed registrations
  static getCompletedRegistrations(): RegistrationRecord[] {
    return Array.from(registrationStore.values()).filter((r) => r.status === "completed")
  }

  // Manual verification (for admin use)
  static manuallyVerifyPayment(paymentId: string, mpesaReceiptNumber: string): boolean {
    const payment = paymentStore.get(paymentId)
    if (!payment) return false

    payment.status = "completed"
    payment.mpesaReceiptNumber = mpesaReceiptNumber
    payment.transactionDate = new Date().toISOString()
    payment.updatedAt = new Date()

    paymentStore.set(paymentId, payment)

    return this.completeRegistration(paymentId)
  }

  // Get payment statistics
  static getPaymentStats() {
    const payments = Array.from(paymentStore.values())
    const registrations = Array.from(registrationStore.values())

    return {
      totalPayments: payments.length,
      completedPayments: payments.filter((p) => p.status === "completed").length,
      pendingPayments: payments.filter((p) => p.status === "pending").length,
      failedPayments: payments.filter((p) => p.status === "failed").length,
      totalRegistrations: registrations.length,
      completedRegistrations: registrations.filter((r) => r.status === "completed").length,
      totalRevenue: payments.filter((p) => p.status === "completed").reduce((sum, p) => sum + p.amount, 0),
    }
  }
}
