import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { v2 as cloudinary } from "cloudinary"
import { MAX_IMAGE_BYTES } from "@/lib/discussion"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("image")
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: "No image provided" }, { status: 400 })
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Only images are allowed" }, { status: 400 })
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image must be under 3MB (it is compressed automatically in the browser)" },
        { status: 400 }
      )
    }

    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "chayan/comments", resource_type: "image" },
        (err, res) => (err || !res ? reject(err || new Error("Upload failed")) : resolve(res))
      )
      stream.end(buffer)
    })

    return NextResponse.json({ success: true, data: { url: result.secure_url } })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Image upload failed" },
      { status: 500 }
    )
  }
}
