import { type NextRequest, NextResponse } from "next/server"
import { setUserPassword } from "@/lib/database-service"

export async function POST(request: NextRequest) {
  try {
    const { registrationId, password } = await request.json()

    if (!registrationId || !password) {
      return NextResponse.json({ success: false, error: "Registration ID and password are required" }, { status: 400 })
    }

    const result = await setUserPassword(registrationId, password)

    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("Setup password error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
