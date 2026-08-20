import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return NextResponse.json({ success: false, error: "Avatar uploads are unavailable right now" }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ success: false, error: "Only JPG, PNG, WEBP and GIF images are supported" }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: "Image must be under 5MB" }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "chayan/avatars",
          resource_type: "image",
          transformation: {
            width: 400,
            height: 400,
            crop: "fill",
            gravity: "face",
            quality: "auto",
            fetchFormat: "auto",
          },
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result as { secure_url: string; public_id: string })
        }
      )
      uploadStream.end(buffer)
    })

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: result.secure_url },
    })

    return NextResponse.json({ success: true, url: result.secure_url, publicId: result.public_id })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Avatar upload failed" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    })

    return NextResponse.json({ success: true, data: null })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to remove avatar" },
      { status: 500 }
    )
  }
}