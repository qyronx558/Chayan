import { Resend } from "resend"

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null
const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@chayanjobs.com"

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "")
}

export async function sendPasswordResetEmail(email: string, token: string) {
  if (!resend) {
    console.log(`[Email Mock] Password reset email to ${email}: ${getBaseUrl()}/reset-password?token=${token}`)
    return { success: true, mocked: true }
  }

  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`

  const { data, error } = await resend.emails.send({
    from: `Chayan <${fromEmail}>`,
    to: email,
    subject: "Reset Your Password - Chayan",
    html: `
      <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
        <h2 style="color:#1e3a5f">Reset Your Password</h2>
        <p style="color:#555;line-height:1.6">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0">Reset Password</a>
        <p style="color:#999;font-size:12px">If you didn't request this, ignore this email. Your password will remain unchanged.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Chayan - select right. serve right.</p>
      </div>
    `,
  })

  if (error) {
    console.error("Failed to send email:", error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

export async function sendNewsletterWelcome(email: string) {
  if (!resend) {
    console.log(`[Email Mock] Newsletter welcome to ${email}`)
    return { success: true, mocked: true }
  }

  const { error } = await resend.emails.send({
    from: `Chayan <${fromEmail}>`,
    to: email,
    subject: "Welcome to Chayan Newsletter!",
    html: `
      <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
        <h2 style="color:#1e3a5f">Welcome to Chayan!</h2>
        <p style="color:#555;line-height:1.6">You've subscribed to our newsletter. You'll now receive the latest government job alerts, exam notifications, and preparation tips directly in your inbox.</p>
        <p style="color:#555;line-height:1.6">Stay tuned for updates!</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">Chayan - select right. serve right.</p>
      </div>
    `,
  })

  if (error) {
    console.error("Failed to send welcome email:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface ApplicationReminderItem {
  type: string
  title: string
  detail: string
  date: string
  href: string
}

export async function sendApplicationReminderEmail(email: string, name: string, reminders: ApplicationReminderItem[]) {
  const itemsHtml = reminders
    .map(
      (r) => `
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #eee">
          <div style="font-size:11px;color:#0d9488;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${r.type}</div>
          <div style="font-size:15px;font-weight:600;color:#111827;margin-top:2px">${r.title}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">${r.detail}</div>
          <div style="margin-top:8px">
            <a href="${r.href}" style="display:inline-block;padding:8px 16px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details</a>
          </div>
        </td>
      </tr>`
    )
    .join("")

  const html = `
    <div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
      <div style="background:linear-gradient(135deg,#134e4a,#0d9488);border-radius:12px 12px 0 0;padding:24px 28px">
        <div style="font-size:20px;font-weight:700;color:#fff">Hello ${name}, your application updates are here</div>
        <div style="font-size:13px;color:#99f6e4;margin-top:4px">Chayan application tracker reminder — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          <tr>
            <td style="padding:16px 18px;background:#f8fafc;font-size:12px;color:#64748b">
              You have ${reminders.length} upcoming deadline${reminders.length === 1 ? "" : "s"} for the jobs you're tracking. Don't miss them!
            </td>
          </tr>
          ${itemsHtml}
          <tr>
            <td style="padding:18px">
              <a href="${getBaseUrl()}/applications" style="display:inline-block;padding:10px 20px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Open My Applications</a>
            </td>
          </tr>
        </table>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#999;font-size:12px;text-align:center">Chayan - select right. serve right. | You are receiving this because you are tracking applications.</p>
    </div>
  `

  if (!resend) {
    console.log(`[Email Mock] Application reminder to ${email}: ${reminders.length} reminders`)
    return { success: true, mocked: true }
  }

  const { data, error } = await resend.emails.send({
    from: `Chayan <${fromEmail}>`,
    to: email,
    subject: `⏰ ${reminders.length} application deadline${reminders.length === 1 ? "" : "s"} coming up — Chayan`,
    html,
  })

  if (error) {
    console.error("Failed to send application reminder email:", error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

export async function sendApplicationReminderSms(phone: string, message: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[SMS Mock] To ${phone}: ${message}`)
    return { success: true, mocked: true }
  }

  try {
    const auth = btoa(`${accountSid}:${authToken}`)
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: phone, From: fromNumber, Body: message }).toString(),
      }
    )
    if (!res.ok) {
      console.error("SMS send failed:", res.status, await res.text())
      return { success: false }
    }
    return { success: true }
  } catch (error) {
    console.error("SMS send error:", error)
    return { success: false }
  }
}
