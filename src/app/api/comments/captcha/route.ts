import { NextResponse } from "next/server"
import { issueCaptcha } from "@/lib/discussion"

export async function GET() {
  return NextResponse.json({ success: true, data: issueCaptcha() })
}
