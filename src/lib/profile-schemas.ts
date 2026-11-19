import { z } from "zod"

function validIndianMobile(v: string | undefined): boolean {
  if (v === undefined || v.trim() === "") return true
  const digits = v.replace(/[\s+\-()]/g, "").replace(/^91/, "")
  return /^[6-9]\d{9}$/.test(digits)
}

const CAREER_INTEREST = z.enum(["active", "open", "paused"])

export const profileUpdateSchema = z.object({
  name: z.string().trim().min(2, "Enter at least 2 characters"),
  language: z.enum(["English", "Hindi", "Tamil", "Telugu", "Bengali"]),
  phone: z.string().trim().max(16).optional().refine(validIndianMobile, {
    message: "Enter a valid 10-digit mobile number",
  }),
  qualification: z.string().optional(),
  dateOfBirth: z.string().optional(),
  preferredStates: z.array(z.string()).optional(),
  interestedCategories: z.array(z.string()).optional(),
  govInterest: CAREER_INTEREST.nullable().optional(),
  privateInterest: CAREER_INTEREST.nullable().optional(),
  headline: z.string().trim().max(90, "Keep it under 90 characters").optional(),
  experienceYears: z.number().int().min(0).max(50).nullable().optional(),
  expectedSalary: z.number().int().min(0).max(100_000_000).nullable().optional(),
  skills: z.array(z.string().trim().min(1).max(40)).max(20, "Up to 20 skills").optional(),
  preferredCities: z.array(z.string().trim().min(1).max(60)).max(10, "Up to 10 cities").optional(),
  workModes: z.array(z.enum(["REMOTE", "HYBRID", "ONSITE"])).optional(),
  jobTypes: z.array(z.enum(["FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"])).optional(),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export const passwordUpdateSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters")
      .regex(/[A-Z]/, "Add one uppercase letter")
      .regex(/[a-z]/, "Add one lowercase letter")
      .regex(/[0-9]/, "Add one number"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

export type PasswordUpdateInput = z.infer<typeof passwordUpdateSchema>

export function passwordStrength(pw: string): { score: number; label: string } {
  let score = 0
  if (pw.length >= 8) score += 1
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 1
  if (/[0-9]/.test(pw)) score += 1
  if (/[^A-Za-z0-9]/.test(pw)) score += 1
  if (pw.length >= 12) score += 1
  const label = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Strong" : "Excellent"
  return { score: Math.min(score, 4), label }
}

export const emailChangeSchema = z.object({
  newEmail: z.string().email("Enter a valid email address"),
})

export const phoneCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
})

export const deleteAccountSchema = z.object({
  confirm: z.literal("DELETE", { message: 'Type DELETE to confirm' }),
})
