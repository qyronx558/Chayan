import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 8 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ success: false, error: "Banner uploads are unavailable right now" }, { status: 503 })
    }
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only JPG, PNG and WEBP images are supported" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Image must be under 8MB" }, { status: 400 })
    }
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `ChayanJobs/banners/${session.user!.id}`,
          resource_type: "image",
          transformation: { width: 1200, height: 300, crop: "fill", gravity: "auto", quality: "auto", fetchFormat: "auto" },
        },
        (error, res) => {
          if (error) reject(error)
          else resolve(res as { secure_url: string; public_id: string })
        }
      )
      uploadStream.end(buffer)
    })
    return NextResponse.json({ success: true, url: result.secure_url })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Banner upload failed" },
      { status: 500 }
    )
  }
}
