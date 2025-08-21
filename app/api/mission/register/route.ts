import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/database"
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Validate required fields
    const requiredFields = [
      "rocimRegistrationId",
      "officialName",
      "email",
      "areaOfResidence",
      "contacts",
      "ministry",
      "healthHistory",
      "arrivalDate",
      "arrivalTime",
      "arrivalPeriod",
    ]

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ success: false, error: `${field} is required` }, { status: 400 })
      }
    }

    if (isSupabaseConfigured) {
      const supabase = createClient()

      // Verify registration exists and get UUID id
      const { data: user } = await supabase
        .from("rocim_registrations")
        .select("id, registration_id")
        .eq("registration_id", data.rocimRegistrationId)
        .single()

      if (!user) {
        return NextResponse.json({ success: false, error: "ROCIM registration not found" }, { status: 404 })
      }

      // Has already registered?
      const { data: existing } = await supabase
        .from("mission_registrations")
        .select("id")
        .eq("registration_id", user.registration_id)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ success: false, error: "You have already registered for this mission" }, { status: 400 })
      }

      const arrivalDateTime = `${data.arrivalDate} ${data.arrivalTime} ${data.arrivalPeriod}`.trim()

      const { data: mission, error } = await supabase
        .from("mission_registrations")
        .insert({
          rocim_registration_id: user.id,
          registration_id: user.registration_id,
          official_name: data.officialName,
          email: data.email,
          area_of_residence: data.areaOfResidence,
          whatsapp_contact: data.contacts,
          call_contact: data.contacts,
          ministry_served: data.ministry,
          health_history: data.healthHistory,
          arrival_date_time: arrivalDateTime,
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, data: mission })
    } else {
      // Fallback local
      const existingMissionReg = db.getMissionRegistrationByRocimId(data.rocimRegistrationId)
      if (existingMissionReg) {
        return NextResponse.json({ success: false, error: "You have already registered for this mission" }, { status: 400 })
      }

      const rocimRegistration = db.getRegistrationById(data.rocimRegistrationId)
      if (!rocimRegistration) {
        return NextResponse.json({ success: false, error: "ROCIM registration not found" }, { status: 404 })
      }

      const missionRegistration = db.createMissionRegistration({
        rocimRegistrationId: data.rocimRegistrationId,
        officialName: data.officialName,
        email: data.email,
        areaOfResidence: data.areaOfResidence,
        contacts: data.contacts,
        ministry: data.ministry,
        healthHistory: data.healthHistory,
        arrivalDate: data.arrivalDate,
        arrivalTime: data.arrivalTime,
        arrivalPeriod: data.arrivalPeriod,
      })

      return NextResponse.json({ success: true, data: missionRegistration })
    }
  } catch (error) {
    console.error("Mission registration error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
