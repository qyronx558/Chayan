import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { INDIAN_STATES_28 } from "@/lib/states"

export async function GET() {
  try {
    // Only the 28 states (no UTs, no cities/capitals), alphabetical.
    // Legacy UT rows stay in the DB so old jobs linked to them keep rendering.
    const states = await prisma.state.findMany({
      where: { name: { in: [...INDIAN_STATES_28] } },
      orderBy: { name: "asc" },
    })
    return NextResponse.json({ success: true, data: states })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to fetch states" },
      { status: 500 }
    )
  }
}
