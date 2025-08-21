// ROCIM Registration Database Service
// This is a local storage implementation for development
// In production, replace with proper database (Supabase, PostgreSQL, etc.)

export interface RegistrationData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string
  gender: string
  address: string
  city: string
  occupation: string
  emergencyContact: string
  emergencyPhone: string
  testimony: string
  ministry: string
  rocimUnit: string
  role: string
  profileImage?: string // Added profile image field
  password: string // Added password field for authentication
  createdAt: Date
  updatedAt: Date
}

export interface PaymentRecord {
  id: string
  registrationId: string
  mpesaCode: string
  amount: number
  phoneNumber: string
  status: "pending" | "verified" | "failed"
  verifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface MissionRegistrationData {
  id: string
  rocimRegistrationId: string
  officialName: string
  email: string
  areaOfResidence: string
  contacts: string
  ministry: string
  healthHistory: string
  arrivalDate: string
  arrivalTime: string
  arrivalPeriod: "AM" | "PM"
  createdAt: Date
  updatedAt: Date
}

export interface RegistrationWithPayment extends RegistrationData {
  payment?: PaymentRecord
}

class ROCIMDatabase {
  private registrations = new Map<string, RegistrationData>()
  private payments = new Map<string, PaymentRecord>()
  private missionRegistrations = new Map<string, MissionRegistrationData>()
  private mpesaCodes = new Set<string>() // Track used M-Pesa codes to prevent duplicates
  private unitCounters = new Map<string, Map<number, number>>() // Track sequential numbers per unit per year

  private generateRegistrationId(rocimUnit: string): string {
    const year = new Date().getFullYear()

    // Map unit names to codes
    const unitCodes: Record<string, string> = {
      "diaspora-unit": "DSP",
      "cambridge-unit": "CAM",
      "moi-unit": "MI",
    }

    const unitCode = unitCodes[rocimUnit] || "UNK"

    // Get or initialize counter for this unit and year
    if (!this.unitCounters.has(unitCode)) {
      this.unitCounters.set(unitCode, new Map())
    }

    const yearCounters = this.unitCounters.get(unitCode)!
    const currentCount = yearCounters.get(year) || 0
    const nextSequence = currentCount + 1

    // Update counter
    yearCounters.set(year, nextSequence)

    // Format: ROCIM/DSP/2025/001
    const sequenceStr = nextSequence.toString().padStart(3, "0")
    return `ROCIM/${unitCode}/${year}/${sequenceStr}`
  }

  // Registration Methods
  async createRegistration(data: Omit<RegistrationData, "id" | "createdAt" | "updatedAt">): Promise<RegistrationData> {
    const id = this.generateRegistrationId(data.rocimUnit)
    const now = new Date()

    const defaultPassword = `${data.firstName.toLowerCase()}${data.phone.slice(-4)}`

    const registration: RegistrationData = {
      ...data,
      id,
      password: data.password || defaultPassword, // Use provided password or generate default
      createdAt: now,
      updatedAt: now,
    }

    this.registrations.set(id, registration)
    return registration
  }

  async getRegistration(id: string): Promise<RegistrationData | null> {
    return this.registrations.get(id) || null
  }

  async getRegistrationByEmail(email: string): Promise<RegistrationData | null> {
    for (const registration of this.registrations.values()) {
      if (registration.email.toLowerCase() === email.toLowerCase()) {
        return registration
      }
    }
    return null
  }

  async getAllRegistrations(): Promise<RegistrationData[]> {
    return Array.from(this.registrations.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async updateRegistration(id: string, updates: Partial<RegistrationData>): Promise<RegistrationData | null> {
    const existing = this.registrations.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Prevent creation date changes
      updatedAt: new Date(),
    }

    this.registrations.set(id, updated)
    return updated
  }

  // Payment Methods
  async createPayment(data: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">): Promise<PaymentRecord> {
    // Check if M-Pesa code is already used
    if (this.mpesaCodes.has(data.mpesaCode.toUpperCase())) {
      throw new Error("This M-Pesa transaction code has already been used")
    }

    const id = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const now = new Date()

    const payment: PaymentRecord = {
      ...data,
      id,
      mpesaCode: data.mpesaCode.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    }

    this.payments.set(id, payment)
    this.mpesaCodes.add(data.mpesaCode.toUpperCase())
    return payment
  }

  async getPayment(id: string): Promise<PaymentRecord | null> {
    return this.payments.get(id) || null
  }

  async getPaymentByRegistrationId(registrationId: string): Promise<PaymentRecord | null> {
    for (const payment of this.payments.values()) {
      if (payment.registrationId === registrationId) {
        return payment
      }
    }
    return null
  }

  async getPaymentByMpesaCode(mpesaCode: string): Promise<PaymentRecord | null> {
    for (const payment of this.payments.values()) {
      if (payment.mpesaCode === mpesaCode.toUpperCase()) {
        return payment
      }
    }
    return null
  }

  async updatePaymentStatus(id: string, status: PaymentRecord["status"]): Promise<PaymentRecord | null> {
    const existing = this.payments.get(id)
    if (!existing) return null

    const updated = {
      ...existing,
      status,
      verifiedAt: status === "verified" ? new Date() : existing.verifiedAt,
      updatedAt: new Date(),
    }

    this.payments.set(id, updated)
    return updated
  }

  async getAllPayments(): Promise<PaymentRecord[]> {
    return Array.from(this.payments.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Combined Methods
  async getRegistrationWithPayment(registrationId: string): Promise<RegistrationWithPayment | null> {
    const registration = await this.getRegistration(registrationId)
    if (!registration) return null

    const payment = await this.getPaymentByRegistrationId(registrationId)

    return {
      ...registration,
      payment: payment || undefined,
    }
  }

  async getAllRegistrationsWithPayments(): Promise<RegistrationWithPayment[]> {
    const registrations = await this.getAllRegistrations()

    const registrationsWithPayments = await Promise.all(
      registrations.map(async (registration) => {
        const payment = await this.getPaymentByRegistrationId(registration.id)
        return {
          ...registration,
          payment: payment || undefined,
        }
      }),
    )

    return registrationsWithPayments
  }

  // Mission Registration Methods
  async createMissionRegistration(
    data: Omit<MissionRegistrationData, "id" | "createdAt" | "updatedAt">,
  ): Promise<MissionRegistrationData> {
    const id = `MISSION_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const now = new Date()

    const missionRegistration: MissionRegistrationData = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    }

    this.missionRegistrations.set(id, missionRegistration)
    return missionRegistration
  }

  async getMissionRegistration(id: string): Promise<MissionRegistrationData | null> {
    return this.missionRegistrations.get(id) || null
  }

  async getMissionRegistrationByRocimId(rocimRegistrationId: string): Promise<MissionRegistrationData | null> {
    for (const missionReg of this.missionRegistrations.values()) {
      if (missionReg.rocimRegistrationId === rocimRegistrationId) {
        return missionReg
      }
    }
    return null
  }

  async getAllMissionRegistrations(): Promise<MissionRegistrationData[]> {
    return Array.from(this.missionRegistrations.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  // Statistics Methods
  async getStats() {
    const allRegistrations = await this.getAllRegistrations()
    const allPayments = await this.getAllPayments()
    const allMissionRegistrations = await this.getAllMissionRegistrations()

    const verifiedPayments = allPayments.filter((p) => p.status === "verified")
    const pendingPayments = allPayments.filter((p) => p.status === "pending")

    // Group by ROCIM unit
    const unitStats = allRegistrations.reduce(
      (acc, reg) => {
        acc[reg.rocimUnit] = (acc[reg.rocimUnit] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    // Group by role
    const roleStats = allRegistrations.reduce(
      (acc, reg) => {
        acc[reg.role] = (acc[reg.role] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      totalRegistrations: allRegistrations.length,
      totalMissionRegistrations: allMissionRegistrations.length,
      verifiedPayments: verifiedPayments.length,
      pendingPayments: pendingPayments.length,
      totalRevenue: verifiedPayments.reduce((sum, p) => sum + p.amount, 0),
      unitDistribution: unitStats,
      roleDistribution: roleStats,
      recentRegistrations: allRegistrations.slice(0, 5),
      recentMissionRegistrations: allMissionRegistrations.slice(0, 5),
    }
  }

  // Utility Methods
  async isMpesaCodeUsed(mpesaCode: string): Promise<boolean> {
    return this.mpesaCodes.has(mpesaCode.toUpperCase())
  }

  async validateMpesaCode(mpesaCode: string): Promise<{ valid: boolean; message?: string }> {
    // Flexible format validation - accepts 8-12 characters, letters and numbers
    const mpesaCodePattern = /^[A-Z0-9]{8,12}$/
    if (!mpesaCodePattern.test(mpesaCode.toUpperCase())) {
      return {
        valid: false,
        message: "Invalid M-Pesa code format. Must be 8-12 characters (letters and numbers)",
      }
    }

    // Check if already used
    if (await this.isMpesaCodeUsed(mpesaCode)) {
      return {
        valid: false,
        message: "This M-Pesa transaction code has already been used",
      }
    }

    return { valid: true }
  }

  // Delete a registration and related records (local store)
  async deleteRegistration(registrationId: string): Promise<boolean> {
    const existing = this.registrations.get(registrationId)
    if (!existing) return false
    // Remove payments for this registration
    for (const [paymentId, payment] of this.payments.entries()) {
      if (payment.registrationId === registrationId) {
        this.payments.delete(paymentId)
        if (payment.mpesaCode) this.mpesaCodes.delete(payment.mpesaCode)
      }
    }
    // Remove mission registrations for this registration
    for (const [missionId, mission] of this.missionRegistrations.entries()) {
      if (mission.rocimRegistrationId === registrationId) {
        this.missionRegistrations.delete(missionId)
      }
    }
    // Finally remove the registration
    this.registrations.delete(registrationId)
    return true
  }

  // Authentication Methods
  async authenticateUser(registrationId: string, password: string): Promise<RegistrationData | null> {
    const registration = await this.getRegistration(registrationId)
    if (!registration) return null

    // Simple password comparison (in production, use proper hashing)
    if (registration.password === password) {
      return registration
    }

    return null
  }

  async updatePassword(registrationId: string, newPassword: string): Promise<boolean> {
    const registration = await this.getRegistration(registrationId)
    if (!registration) return false

    const updated = await this.updateRegistration(registrationId, { password: newPassword })
    return updated !== null
  }

  // Development/Testing Methods
  async clearAllData(): Promise<void> {
    this.registrations.clear()
    this.payments.clear()
    this.mpesaCodes.clear()
    this.unitCounters.clear()
    this.missionRegistrations.clear()
  }

  async seedTestData(): Promise<void> {
    // Create sample registrations for testing
    const testRegistrations = [
      {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        phone: "0712345678",
        dateOfBirth: "1990-01-15",
        gender: "male",
        address: "123 Main Street",
        city: "Nairobi",
        occupation: "Teacher",
        emergencyContact: "Jane Doe",
        emergencyPhone: "0723456789",
        testimony: "I found Christ through this ministry",
        ministry: "worship",
        rocimUnit: "cambridge-unit",
        role: "member",
        password: "john5678", // Added default password
      },
      {
        firstName: "Mary",
        lastName: "Smith",
        email: "mary.smith@example.com",
        phone: "0734567890",
        dateOfBirth: "1985-05-20",
        gender: "female",
        address: "456 Oak Avenue",
        city: "Mombasa",
        occupation: "Nurse",
        emergencyContact: "Peter Smith",
        emergencyPhone: "0745678901",
        testimony: "God has been faithful in my life",
        ministry: "intercessory",
        rocimUnit: "diaspora-unit",
        role: "youth-leader",
        password: "mary7890", // Added default password
      },
      {
        firstName: "David",
        lastName: "Johnson",
        email: "david.johnson@example.com",
        phone: "0756789012",
        dateOfBirth: "1992-08-10",
        gender: "male",
        address: "789 Pine Road",
        city: "Kisumu",
        occupation: "Engineer",
        emergencyContact: "Sarah Johnson",
        emergencyPhone: "0767890123",
        testimony: "Blessed to serve in this ministry",
        ministry: "discipleship",
        rocimUnit: "moi-unit",
        role: "teacher",
        password: "david9012", // Added default password
      },
    ]

    for (const regData of testRegistrations) {
      const registration = await this.createRegistration(regData)

      // Create corresponding payment
      await this.createPayment({
        registrationId: registration.id,
        mpesaCode: `QH${Math.floor(Math.random() * 100000000)
          .toString()
          .padStart(8, "0")}`,
        amount: 200,
        phoneNumber: "0703877167",
        status: "verified",
        verifiedAt: new Date(),
      })
    }

    // Create sample mission registrations for testing
    const testMissionRegistrations = [
      {
        rocimRegistrationId: "ROCIM/CAM/2025/001",
        officialName: "John Doe",
        email: "john.doe@example.com",
        areaOfResidence: "Nairobi",
        contacts: "0712345678",
        ministry: "worship",
        healthHistory: "Good",
        arrivalDate: "2025-01-01",
        arrivalTime: "10:00",
        arrivalPeriod: "AM",
      },
      {
        rocimRegistrationId: "ROCIM/DSP/2025/002",
        officialName: "Mary Smith",
        email: "mary.smith@example.com",
        areaOfResidence: "Mombasa",
        contacts: "0734567890",
        ministry: "intercessory",
        healthHistory: "Good",
        arrivalDate: "2025-01-02",
        arrivalTime: "11:00",
        arrivalPeriod: "AM",
      },
    ]

    for (const missionRegData of testMissionRegistrations) {
      await this.createMissionRegistration(missionRegData)
    }
  }

  async getDatabaseContents() {
    const registrations = await this.getAllRegistrationsWithPayments()
    const missionRegistrations = await this.getAllMissionRegistrations()
    const stats = await this.getStats()

    return {
      registrations,
      missionRegistrations,
      stats,
      totalRecords: registrations.length,
      totalMissionRecords: missionRegistrations.length,
      unitCounters: Object.fromEntries(this.unitCounters.entries()),
    }
  }

  // Convenience Methods for external access
  getRegistrationById(id: string): RegistrationData | null {
    return this.registrations.get(id) || null
  }

  getMissionRegistrationById(id: string): MissionRegistrationData | null {
    return this.missionRegistrations.get(id) || null
  }

  getMissionRegistrationByRocimId(rocimRegistrationId: string): MissionRegistrationData | null {
    for (const missionReg of this.missionRegistrations.values()) {
      if (missionReg.rocimRegistrationId === rocimRegistrationId) {
        return missionReg
      }
    }
    return null
  }
}

// Singleton instance
export const rocimDB = new ROCIMDatabase()

export const db = rocimDB

// Optional local dev seeding: disabled by default. Set NEXT_PUBLIC_ROCIM_ENABLE_LOCAL_SEED=true to enable.
if (typeof window !== "undefined") {
  const enableSeed = (process.env.NEXT_PUBLIC_ROCIM_ENABLE_LOCAL_SEED || "").toLowerCase() === "true"
  if (enableSeed) {
    const hasSeeded = localStorage.getItem("rocim_db_seeded")
    if (!hasSeeded) {
      rocimDB.seedTestData().then(() => {
        localStorage.setItem("rocim_db_seeded", "true")
        console.log("ROCIM local DB seeded with test data (explicitly enabled)")
      })
    }
  }
}
