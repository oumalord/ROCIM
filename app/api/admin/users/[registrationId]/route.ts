import { type NextRequest, NextResponse } from "next/server"
import { isSupabaseConfigured, createClient } from "@/lib/supabase/server"
import { rocimDB } from "@/lib/database"

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { registrationId: string } },
) {
  try {
    const { registrationId } = params
    if (!registrationId) {
      return NextResponse.json({ success: false, error: "Registration ID is required" }, { status: 400 })
    }

    if (isSupabaseConfigured) {
      const supabase = createClient()

      // Find row by registration_id to get UUID id
      const { data: user, error: findErr } = await supabase
        .from("rocim_registrations")
        .select("id")
        .eq("registration_id", registrationId)
        .single()

      if (findErr || !user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      const { error } = await supabase.from("rocim_registrations").delete().eq("id", user.id)
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    } else {
      const ok = await rocimDB.deleteRegistration(registrationId)
      if (!ok) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("Admin delete user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}


