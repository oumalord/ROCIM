import { type NextRequest, NextResponse } from "next/server"
import { rocimDB } from "@/lib/database"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { createROCIMRegistration } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "dateOfBirth",
      "gender",
      "address",
      "city",
      "emergencyContact",
      "emergencyPhone",
      "ministry",
      "rocimUnit",
      "role",
    ]

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 })
      }
    }

    if (isSupabaseConfigured) {
      // Supabase-backed creation
      const result = await createROCIMRegistration({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        phone: body.phone,
        date_of_birth: body.dateOfBirth,
        gender: body.gender,
        address: body.address,
        city: body.city,
        county: body.city,
        emergency_contact_name: body.emergencyContact,
        emergency_contact_phone: body.emergencyPhone,
        emergency_contact_relationship: "N/A",
        rocim_unit: body.rocimUnit,
        ministry: body.ministry,
        role: body.role,
        testimony: body.testimony || "",
        profile_image: body.profileImage || null,
        payment_verified: false,
      } as any)

      if (!result.success) {
        const isDuplicate = result.error?.toLowerCase().includes("duplicate") || result.error?.includes("unique")
        return NextResponse.json(
          { success: false, error: isDuplicate ? "Email address is already registered" : result.error },
          { status: isDuplicate ? 409 : 400 },
        )
      }

      return NextResponse.json({
        success: true,
        data: { id: result.registration_id, registration_id: result.registration_id },
      })
    } else {
      // Fallback to in-memory DB
      const existingRegistration = await rocimDB.getRegistrationByEmail(body.email)
      if (existingRegistration) {
        return NextResponse.json({ success: false, error: "Email address is already registered" }, { status: 409 })
      }

      const registration = await rocimDB.createRegistration({
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        dateOfBirth: body.dateOfBirth,
        gender: body.gender,
        address: body.address,
        city: body.city,
        occupation: body.occupation || "",
        emergencyContact: body.emergencyContact,
        emergencyPhone: body.emergencyPhone,
        testimony: body.testimony || "",
        ministry: body.ministry,
        rocimUnit: body.rocimUnit,
        role: body.role,
      })

      return NextResponse.json({ success: true, data: registration })
    }
  } catch (error) {
    console.error("Registration creation error:", error)
    return NextResponse.json({ success: false, error: "Failed to create registration" }, { status: 500 })
  }
}
