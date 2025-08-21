import { type NextRequest, NextResponse } from "next/server"
import { rocimDB } from "@/lib/database"
import { isSupabaseConfigured } from "@/lib/supabase/server"
import { authenticateUser as authenticateUserSupabase } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { registrationId, password } = await request.json()

    if (!registrationId || !password) {
      return NextResponse.json({ success: false, error: "Registration ID and password are required" }, { status: 400 })
    }

    if (isSupabaseConfigured) {
      const result = await authenticateUserSupabase(registrationId, password)
      if (!result.success || !result.user) {
        return NextResponse.json({ success: false, error: result.error || "Invalid credentials" }, { status: 401 })
      }
      return NextResponse.json({
        success: true,
        data: {
          registrationId: result.user.registration_id,
          firstName: result.user.first_name,
          lastName: result.user.last_name,
          email: result.user.email,
        },
      })
    } else {
      // In-memory fallback
      const user = await rocimDB.authenticateUser(registrationId, password)

      if (!user) {
        return NextResponse.json({ success: false, error: "Invalid Registration ID or password" }, { status: 401 })
      }

      return NextResponse.json({
        success: true,
        data: {
          registrationId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
      })
    }
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
