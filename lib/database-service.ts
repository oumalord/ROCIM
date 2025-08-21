import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export interface ROCIMRegistration {
  id?: string
  registration_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  address: string
  city: string
  county: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_relationship: string
  rocim_unit: string
  ministry: string
  role: string
  testimony?: string
  profile_image?: string
  password_hash?: string
  payment_verified: boolean
  mpesa_code?: string
  created_at?: string
  updated_at?: string
}

export interface MissionRegistration {
  id?: string
  rocim_registration_id: string
  official_name: string
  email: string
  area_of_residence: string
  whatsapp_contact: string
  call_contact: string
  ministry_served: string
  health_history: string
  arrival_date_time: string
  created_at?: string
}

// Generate registration ID in format ROCIM/(UNITCODE)/(YEAR)/(SEQ)
export async function generateRegistrationId(unit: string): Promise<string> {
  const supabase = createClient()
  const year = new Date().getFullYear()

  // Map unit names to codes
  const unitCodesByName: Record<string, string> = {
    "Diaspora Unit": "DSP",
    "Cambridge Unit": "CAM",
    "Moi Unit": "MI",
  }
  // Accept slug values from the UI as well
  const unitCodesBySlug: Record<string, string> = {
    "diaspora-unit": "DSP",
    "cambridge-unit": "CAM",
    "moi-unit": "MI",
  }

  const unitCode = unitCodesBySlug[unit] || unitCodesByName[unit] || "UNK"

  // Get the count of registrations for this unit and year
  const { data, error } = await supabase
    .from("rocim_registrations")
    .select("registration_id")
    .like("registration_id", `ROCIM/${unitCode}/${year}/%`)
    .order("registration_id", { ascending: false })
    .limit(1)

  if (error) {
    console.error("Error getting registration count:", error)
    return `ROCIM/${unitCode}/${year}/001`
  }

  let nextSeq = 1
  if (data && data.length > 0) {
    const lastId = data[0].registration_id
    const lastSeq = Number.parseInt(lastId.split("/")[3])
    nextSeq = lastSeq + 1
  }

  return `ROCIM/${unitCode}/${year}/${nextSeq.toString().padStart(3, "0")}`
}

// Create ROCIM registration
export async function createROCIMRegistration(
  data: Omit<ROCIMRegistration, "id" | "registration_id" | "created_at" | "updated_at">,
): Promise<{ success: boolean; registration_id?: string; error?: string }> {
  const supabase = createClient()

  try {
    const registration_id = await generateRegistrationId(data.rocim_unit)

    const { data: result, error } = await supabase
      .from("rocim_registrations")
      .insert({
        ...data,
        registration_id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, registration_id }
  } catch (error) {
    return { success: false, error: "Failed to create registration" }
  }
}

// Verify payment and update registration
export async function verifyPayment(
  registrationId: string,
  mpesaCode: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    // Check if M-Pesa code is already used
    const { data: existing } = await supabase
      .from("rocim_registrations")
      .select("id")
      .eq("mpesa_code", mpesaCode)
      .single()

    if (existing) {
      return { success: false, error: "This M-Pesa code has already been used" }
    }

    const { error } = await supabase
      .from("rocim_registrations")
      .update({
        payment_verified: true,
        mpesa_code: mpesaCode, // Declare the variable here
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", registrationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to verify payment" }
  }
}

// Set user password
export async function setUserPassword(
  registrationId: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient()

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const { error } = await supabase
      .from("rocim_registrations")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", registrationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: "Failed to set password" }
  }
}

// Authenticate user
export async function authenticateUser(
  registrationId: string,
  password: string,
): Promise<{ success: boolean; user?: ROCIMRegistration; error?: string }> {
  const supabase = createClient()

  try {
    const { data: user, error } = await supabase
      .from("rocim_registrations")
      .select("*")
      .eq("registration_id", registrationId)
      .single()

    if (error || !user) {
      return { success: false, error: "Invalid registration ID" }
    }

    if (!user.password_hash) {
      return { success: false, error: "Password not set. Please set your password first." }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: "Invalid password" }
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: "Authentication failed" }
  }
}
