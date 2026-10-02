import { prisma } from "@/lib/prisma"

export type SMSProvider = "twilio" | "msg91" | "generic" | "console"

interface SMSConfig {
  provider: SMSProvider
  twilio?: {
    accountSid: string
    authToken: string
    fromNumber: string
  }
  msg91?: {
    authKey: string
    templateId?: string
    senderId?: string
    flowId?: string
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
  } else if (provider === "msg91") {
    config = {
      provider: "msg91",
      msg91: {
        authKey: process.env.MSG91_AUTH_KEY || "",
        templateId: process.env.MSG91_TEMPLATE_ID || "",
        senderId: process.env.MSG91_SENDER_ID || "ChayanJobs",
        flowId: process.env.MSG91_FLOW_ID || "",
      },
      fromNumber: process.env.MSG91_SENDER_ID || "ChayanJobs",
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
    config = { provider: "console", fromNumber: "ChayanJobs" }
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

  if (cfg.provider === "msg91") {
    return sendViaMsg91(cfg.msg91!, phone, message)
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

async function sendViaMsg91(
  msg91: { authKey: string; templateId?: string; senderId?: string; flowId?: string },
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  try {
    // Msg91 Flow API (recommended for transactional/promotional)
    // Docs: https://msg91.com/docs/api/flow-api
    const baseUrl = "https://api.msg91.com/api/v5/flow/"

    // Remove +91 prefix for Msg91 (they expect 10-digit)
    const cleanPhone = phone.replace(/^\+91/, "").replace(/^91/, "")

    // If flowId is provided, use Flow API (template-based)
    if (msg91.flowId) {
      const url = `${baseUrl}${msg91.flowId}/send`
      const body = {
        mobiles: cleanPhone,
        // Template variables - Msg91 expects these as key-value pairs
        // You can customize based on your template variables
        var1: message,
        // var2, var3, etc. if your template has more variables
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": msg91.authKey,
        },
        body: JSON.stringify(body),
      })

      const result = await response.json().catch(() => ({}))

      if (!response.ok) {
        return { success: false, error: `Msg91 Flow API HTTP ${response.status}: ${JSON.stringify(result)}` }
      }

      // Msg91 returns { type: "success", message: "Message sent", requestId: "..." }
      if (result.type === "success" || result.requestId) {
        return { success: true, messageId: result.requestId || "msg91-" + Date.now() }
      }
      return { success: false, error: `Msg91: ${result.message || "Unknown error"}` }
    }

    // Fallback: HTTP API (older, but works for simple sending)
    // Docs: https://msg91.com/docs/api/http-api
    const httpUrl = "https://api.msg91.com/api/v2/sendsms"
    const httpBody = {
      sender: msg91.senderId || "ChayanJobs",
      route: "4", // 4 = transactional, 1 = promotional
      country: "91",
      sms: [
        {
          message: message,
          to: [cleanPhone],
        },
      ],
    }

    const response = await fetch(httpUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "authkey": msg91.authKey,
      },
      body: JSON.stringify(httpBody),
    })

    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      return { success: false, error: `Msg91 HTTP API HTTP ${response.status}: ${JSON.stringify(result)}` }
    }

    if (result.type === "success" || result.requestId) {
      return { success: true, messageId: result.requestId || "msg91-" + Date.now() }
    }
    return { success: false, error: `Msg91: ${result.message || "Unknown error"}` }
  } catch (error) {
    console.error("Msg91 SMS error:", error)
    return { success: false, error: error instanceof Error ? error.message : "Msg91 send failed" }
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
    const smsMessage = `[ChayanJobs] ${text}`

    await sendSMS(formattedPhone, smsMessage)
  } catch (error) {
    console.error("Failed to send notification SMS:", error)
  }
}

export async function sendOTPSMS(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone)
  const message = `[ChayanJobs] Your verification code is ${otp}. Valid for 10 minutes. Do not share.`
  return sendSMS(formattedPhone, message)
}

export async function sendWelcomeSMS(phone: string): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = formatPhoneNumber(phone)
  const message = `[ChayanJobs] Welcome! You've successfully verified your phone number. You'll now receive SMS alerts for job notifications, results, and admit cards based on your preferences.`
  return sendSMS(formattedPhone, message)
}