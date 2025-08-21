import { rocimDB } from "@/lib/database"
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    if (isSupabaseConfigured) {
      const supabaseClient = createClient() as any

      const { data: registrations } = await supabaseClient
        .from("rocim_registrations")
        .select("*, payment_verified, mpesa_code")
        .order("created_at", { ascending: false })

      const { data: missionRegistrations } = await supabaseClient
        .from("mission_registrations")
        .select("*")
        .order("created_at", { ascending: false })

      const stats = {
        totalRegistrations: registrations?.length || 0,
        totalMissionRegistrations: missionRegistrations?.length || 0,
        verifiedPayments: registrations?.filter((r: any) => r.payment_verified)?.length || 0,
        pendingPayments: registrations?.filter((r: any) => !r.payment_verified)?.length || 0,
        totalRevenue: (registrations || [])
          .filter((r: any) => r.payment_verified)
          .reduce((sum: number) => sum + 200, 0),
        unitDistribution: (registrations || []).reduce((acc: Record<string, number>, r: any) => {
          acc[r.rocim_unit] = (acc[r.rocim_unit] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        roleDistribution: (registrations || []).reduce((acc: Record<string, number>, r: any) => {
          acc[r.role] = (acc[r.role] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        recentRegistrations: registrations?.slice(0, 5) || [],
        recentMissionRegistrations: missionRegistrations?.slice(0, 5) || [],
      }

      const normalizedRegistrations = (registrations || []).map((user: any) => ({
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
      }))

      const normalizedMissionRegistrations = (missionRegistrations || []).map((m: any) => ({
        id: m.id,
        rocimRegistrationId: m.registration_id || m.rocim_registration_id,
        officialName: m.official_name,
        email: m.email,
        areaOfResidence: m.area_of_residence,
        contacts: `${m.whatsapp_contact}`,
        ministry: m.ministry_served,
        healthHistory: m.health_history,
        arrivalDate: m.arrival_date_time?.split(" ")[0] || "",
        arrivalTime: m.arrival_date_time?.split(" ")[1] || "",
        arrivalPeriod: (m.arrival_date_time?.includes("AM") ? "AM" : "PM") as "AM" | "PM",
        createdAt: m.created_at,
      }))

      return Response.json({
        success: true,
        data: { registrations: normalizedRegistrations, missionRegistrations: normalizedMissionRegistrations, stats },
      })
    } else {
      const contents = await rocimDB.getDatabaseContents()
      return Response.json({ success: true, data: contents })
    }
  } catch (error) {
    console.error("Database contents error:", error)
    return Response.json({ success: false, error: "Failed to fetch database contents" }, { status: 500 })
  }
}
