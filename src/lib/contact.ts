import { z } from "zod"
import { CHANNEL_TOPICS } from "@/lib/channels"

const TOPIC_VALUES = CHANNEL_TOPICS.map((topic) => topic.value) as [string, ...string[]]

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(120, "Name is too long").regex(/^[^\r\n\u0000-\u001f\u007f]+$/, "Name contains invalid characters"),
  email: z.string().trim().email("Enter a valid email address").max(254, "Email is too long"),
  topic: z.enum(TOPIC_VALUES, "Choose a topic"),
  subject: z.string().trim().min(3, "Add a short subject").max(200, "Subject is too long").regex(/^[^\r\n\u0000-\u001f\u007f]+$/, "Subject must be a single line"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(8000, "Message is too long"),
  website: z.string().max(200).optional().default(""),
})

export type ContactInput = z.infer<typeof contactSchema>

export type ContactFormInput = z.input<typeof contactSchema>

