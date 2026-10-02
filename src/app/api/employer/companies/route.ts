import { NextRequest, NextResponse } from "next/server"

/**
 * DEPRECATED bypass path - direct creation without inbox proof is disabled.
 * Manual companies are now created ONLY after OTP confirms the work inbox
 * (POST /api/employer/verify/send -> POST /api/employer/verify/confirm).
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { success: false, error: "Direct company creation is disabled. Verify your work inbox with OTP first (Studio Step 1).", code: "OTP_REQUIRED" },
    { status: 410 }
  )
}
