import { type NextRequest, NextResponse } from "next/server"
import { rocimDB } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const stats = await rocimDB.getStats()
    const allRegistrations = await rocimDB.getAllRegistrationsWithPayments()

    return NextResponse.json({
      success: true,
      data: {
        stats,
        registrations: allRegistrations,
      },
    })
  } catch (error) {
    console.error("Admin dashboard error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
