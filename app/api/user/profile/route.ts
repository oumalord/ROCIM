import { type NextRequest, NextResponse } from "next/server"
import { rocimDB } from "@/lib/database"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const registrationId = searchParams.get("registrationId")

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "Registration ID is required" }, { status: 400 })
    }

    if (isSupabaseConfigured) {
      const supabase = createClient()
      const { data: user, error } = await supabase
        .from("rocim_registrations")
        .select("*, payment_verified, mpesa_code")
        .eq("registration_id", registrationId)
        .single()

      if (error || !user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      // Normalize to the shape expected by the dashboard
      const normalized = {
        id: user.registration_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        city: user.city,
        occupation: user.occupation || "",
        emergencyContact: user.emergency_contact_name,
        emergencyPhone: user.emergency_contact_phone,
        testimony: user.testimony || "",
        ministry: user.ministry,
        rocimUnit: user.rocim_unit,
        role: user.role,
        profileImage: user.profile_image || undefined,
        createdAt: user.created_at,
        payment: user.payment_verified
          ? {
              id: user.id,
              mpesaCode: user.mpesa_code || "",
              amount: 200,
              status: "verified",
              verifiedAt: user.updated_at,
            }
          : undefined,
      }

      return NextResponse.json({ success: true, data: normalized })
    } else {
      // Fallback to in-memory DB
      const userData = await rocimDB.getRegistrationWithPayment(registrationId)
      if (!userData) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: userData })
    }
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { registrationId, updates } = body || {}

    if (!registrationId) {
      return NextResponse.json({ success: false, error: "Registration ID is required" }, { status: 400 })
    }

    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ success: false, error: "Updates payload is required" }, { status: 400 })
    }

    // Whitelist editable fields
    const allowedFields = new Set([
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
      "occupation",
      "emergencyContact",
      "emergencyPhone",
      "testimony",
      "ministry",
      "rocimUnit",
      "profileImage",
      "gender",
      "dateOfBirth",
    ])

    const filteredUpdates: Record<string, unknown> = {}
    for (const key of Object.keys(updates)) {
      if (allowedFields.has(key)) {
        filteredUpdates[key] = updates[key]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ success: false, error: "No valid fields to update" }, { status: 400 })
    }

    if (isSupabaseConfigured) {
      const supabase = createClient()
      const payload: Record<string, any> = {}
      // map camelCase to snake_case
      if (filteredUpdates.firstName) payload.first_name = filteredUpdates.firstName
      if (filteredUpdates.lastName) payload.last_name = filteredUpdates.lastName
      if (filteredUpdates.email) payload.email = filteredUpdates.email
      if (filteredUpdates.phone) payload.phone = filteredUpdates.phone
      if (filteredUpdates.address) payload.address = filteredUpdates.address
      if (filteredUpdates.city) payload.city = filteredUpdates.city
      if (filteredUpdates.occupation) payload.occupation = filteredUpdates.occupation
      if (filteredUpdates.emergencyContact) payload.emergency_contact_name = filteredUpdates.emergencyContact
      if (filteredUpdates.emergencyPhone) payload.emergency_contact_phone = filteredUpdates.emergencyPhone
      if (filteredUpdates.testimony !== undefined) payload.testimony = filteredUpdates.testimony
      if (filteredUpdates.ministry) payload.ministry = filteredUpdates.ministry
      if (filteredUpdates.rocimUnit) payload.rocim_unit = filteredUpdates.rocimUnit
      if (filteredUpdates.profileImage !== undefined) payload.profile_image = filteredUpdates.profileImage
      if (filteredUpdates.gender) payload.gender = filteredUpdates.gender
      if (filteredUpdates.dateOfBirth) payload.date_of_birth = filteredUpdates.dateOfBirth
      payload.updated_at = new Date().toISOString()

      const { error } = await supabase
        .from("rocim_registrations")
        .update(payload)
        .eq("registration_id", registrationId)

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      // Return updated data
      const { data: user } = await supabase
        .from("rocim_registrations")
        .select("*, payment_verified, mpesa_code")
        .eq("registration_id", registrationId)
        .single()

      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      const normalized = {
        id: user.registration_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.date_of_birth,
        gender: user.gender,
        address: user.address,
        city: user.city,
        occupation: user.occupation || "",
        emergencyContact: user.emergency_contact_name,
        emergencyPhone: user.emergency_contact_phone,
        testimony: user.testimony || "",
        ministry: user.ministry,
        rocimUnit: user.rocim_unit,
        role: user.role,
        profileImage: user.profile_image || undefined,
        createdAt: user.created_at,
        payment: user.payment_verified
          ? { id: user.id, mpesaCode: user.mpesa_code || "", amount: 200, status: "verified", verifiedAt: user.updated_at }
          : undefined,
      }

      return NextResponse.json({ success: true, data: normalized })
    } else {
      const updated = await rocimDB.updateRegistration(registrationId, filteredUpdates as any)
      if (!updated) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      const withPayment = await rocimDB.getRegistrationWithPayment(registrationId)
      return NextResponse.json({ success: true, data: withPayment })
    }
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
