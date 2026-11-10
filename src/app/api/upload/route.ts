import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import { isAdmin } from "@/lib/roles"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session || !isAdmin(session.user.role)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ success: false, error: "Cloudinary not configured" }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    if (typeof file === "string" || !file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only image files can be uploaded" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Image must be under 10MB" }, { status: 400 })
    }

    // The folder comes from the browser: keep it to a plain relative path.
    const requestedFolder = formData.get("folder")
    const folder =
      typeof requestedFolder === "string" && /^[A-Za-z0-9_-]+(\/[A-Za-z0-9_-]+){0,3}$/.test(requestedFolder)
        ? requestedFolder
        : "ChayanJobs"
    const transform = (formData.get("transform") as string) || ""
    const buffer = Buffer.from(await file.arrayBuffer())

    const transformOptions = transform === "slide"
      ? {
          width: 1200,
          height: 900,
          crop: "fill",
          gravity: "auto",
          quality: "auto",
          fetchFormat: "auto",
        }
      : {}

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder, resource_type: "image", transformation: transformOptions },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string; public_id: string })
        }
      )
      uploadStream.end(buffer)
    })

    return NextResponse.json({ success: true, url: result.secure_url, publicId: result.public_id })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    )
  }
}
