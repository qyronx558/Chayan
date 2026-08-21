import { prisma } from "@/lib/prisma"

export type SMSProvider = "twilio" | "generic" | "console"

interface SMSConfig {
  provider: SMSProvider
  twilio?: {
    accountSid: string
    authToken: string
    fromNumber: string
  }
  generic?: {
    url: string
    method: "GET" | "POST"
    headers: Record<string, string>
    bodyTemplate: (phone: string, message: string) => Record<string, unknown>
  }
  fromNumber?: string
}

let config: SMSConfig | null = null

function getConfig(): SMSConfig {
  if (config) return config

  const provider = (process.env.SMS_PROVIDER as SMSProvider) || "console"

  if (provider === "twilio") {
    config = {
      provider: "twilio",
      twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || "",
        authToken: process.env.TWILIO_AUTH_TOKEN || "",
        fromNumber: process.env.TWILIO_FROM_NUMBER || "",
      },
      fromNumber: process.env.TWILIO_FROM_NUMBER,
    }
  } else if (provider === "generic") {
    config = {
      provider: "generic",
      generic: {
        url: process.env.SMS_API_URL || "",
        method: (process.env.SMS_API_METHOD as "GET" | "POST") || "POST",
        headers: JSON.parse(process.env.SMS_API_HEADERS || '{"Content-Type": "application/json"}'),
        bodyTemplate: (phone: string, message: string) => ({
          phone,
          message,
        }),
      },
      fromNumber: process.env.SMS_FROM_NUMBER,
    }
  } else {
    config = { provider: "console", fromNumber: "CHAYAN" }
  }

  return config
}

export async function sendSMS(phone: string, message: string): Promise<{ success: boolean; error?: string; messageId?: string }> {
  const cfg = getConfig()

  if (cfg.provider === "console") {
    console.log(`[SMS] To: ${phone}`)
    console.log(`[SMS] Message: ${message}`)
    return { success: true, messageId: "console-" + Date.now() }
  }

  if (cfg.provider === "twilio") {
    return sendViaTwilio(cfg.twilio!, phone, message)
  }

  if (cfg.provider === "generic") {
    return sendViaGeneric(cfg.generic!, phone, message)
  }

  return { success: false, error: "No SMS provider configured" }
}

async function sendViaTwilio(
  twilio: { accountSid: string; authToken: string; fromNumber: string },
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const twilioModule = await import("twilio")
    const Twilio = twilioModule.default
    const client = Twilio(twilio.accountSid, twilio.authToken)

    const result = await client.messages.create({
      body: message,
      from: twilio.fromNumber,
      to: phone,
    })

    return { success: true, messageId: result.sid }
  } catch (error) {
    console.error("Twilio SMS error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Twilio send failed" }
  }
}

async function sendViaGeneric(
  generic: { url: string; method: "GET" | "POST"; headers: Record<string, string>; bodyTemplate: (phone: string, message: string) => Record<string, unknown> },
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    const body = generic.bodyTemplate(phone, message)
    const options: RequestInit = {
      method: generic.method,
      headers: generic.headers,
    }

    if (generic.method === "POST") {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(generic.url, options)

    if (!response.ok) {
      const errorText = await response.text()
      return { success: false, error: `HTTP ${response.status}: ${errorText}` }
    }

    const result = await response.json().catch(() => ({}))
    return { success: true, messageId: result.messageId || result.id || "generic-" + Date.now() }
  } catch (error) {
    console.error("Generic SMS error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Generic send failed" }
  }
}

export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "")

  if (cleaned.startsWith("0")) {
    cleaned = "91" + cleaned.slice(1)
  }

  if (cleaned.length === 10) {
    cleaned = "91" + cleaned
  }

  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned
  }

  return cleaned
}

export function isValidIndianPhoneNumber(phone: string): boolean {
  const formatted = formatPhoneNumber(phone)
  return /^\+91[6-9]\d{9}$/.test(formatted)
}

export async function sendNotificationSMS(
  userId: string,
  type: string,
  title: string,
  message?: string
): Promise<void> {
  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId },
      select: {
        phoneVerified: true,
        smsJobAlerts: true,
        smsResultAlerts: true,
        smsAdmitCardAlerts: true,
        smsPrivateJobAlerts: true,
        smsAdmissionAlerts: true,
        smsBlogAlerts: true,
        smsSyllabusAlerts: true,
        smsAnswerKeyAlerts: true,
        smsGeneralAlerts: true,
        user: { select: { phone: true } },
      },
    })

    if (!pref || !pref.phoneVerified || !pref.user?.phone) {
      return
    }

    const smsPrefKey = `sms${type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()}Alerts` as keyof typeof pref
    if (!pref[smsPrefKey]) {
      return
    }

    const text = message || `${title}`
    const formattedPhone = formatPhoneNumber(pref.user.phone)
    const smsMessage = `[Chayan] ${text}`

    await sendSMS(formattedPhone, smsMessage)
  } catch (error) {
    console.error("Failed to send notification SMS:", error)
  }
}

export async function sendOTPSMS(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone)
  const message = `[Chayan] Your verification code is ${otp}. Valid for 10 minutes. Do not share.`
  return sendSMS(formattedPhone, message)
}

export async function sendWelcomeSMS(phone: string): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone)
  const message = `[Chayan] Welcome! You've successfully verified your phone number. You'll now receive SMS alerts for job notifications, results, and admit cards based on your preferences.`
  return sendSMS(formattedPhone, message)
}