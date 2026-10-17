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
    from: `ChayanJobs <${fromEmail}>`,
    to: email,
    subject: "Reset Your Password - ChayanJobs",
    html: `
      <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
        <h2 style="color:#1e3a5f">Reset Your Password</h2>
        <p style="color:#555;line-height:1.6">You requested a password reset. Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;margin:16px 0">Reset Password</a>
        <p style="color:#999;font-size:12px">If you didn't request this, ignore this email. Your password will remain unchanged.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">ChayanJobs - select right. serve right.</p>
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
    from: `ChayanJobs <${fromEmail}>`,
    to: email,
    subject: "Welcome to ChayanJobs Newsletter!",
    html: `
      <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
        <h2 style="color:#1e3a5f">Welcome to ChayanJobs!</h2>
        <p style="color:#555;line-height:1.6">You've subscribed to our newsletter. You'll now receive the latest government job alerts, exam notifications, and preparation tips directly in your inbox.</p>
        <p style="color:#555;line-height:1.6">Stay tuned for updates!</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px">ChayanJobs - select right. serve right.</p>
      </div>
    `,
  })

  if (error) {
    console.error("Failed to send welcome email:", error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

export interface NewsletterDigestItem {
  type: string
  title: string
  detail: string
  href: string
}

export async function sendNewsletterDigest(
  email: string,
  items: NewsletterDigestItem[],
  unsubscribeToken?: string
) {
  const baseUrl = getBaseUrl()
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding:14px 18px;border-bottom:1px solid #eee">
          <div style="font-size:11px;color:#0d9488;font-weight:700;text-transform:uppercase;letter-spacing:0.05em">${item.type}</div>
          <div style="font-size:15px;font-weight:600;color:#111827;margin-top:2px">${item.title}</div>
          <div style="font-size:13px;color:#6b7280;margin-top:4px">${item.detail}</div>
          <div style="margin-top:8px">
            <a href="${baseUrl}${item.href}" style="display:inline-block;padding:8px 16px;background:#0d9488;color:#fff;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600">View Details</a>
          </div>
        </td>
      </tr>`
    )
    .join("")

  const unsubscribeHtml = unsubscribeToken
    ? `<a href="${baseUrl}/api/newsletter/unsubscribe?token=${unsubscribeToken}" style="color:#999">Unsubscribe</a>`
    : "You are receiving this because you subscribed to ChayanJobs job alerts."

  const html = `
    <div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
      <div style="background:linear-gradient(135deg,#134e4a,#0d9488);border-radius:12px 12px 0 0;padding:24px 28px">
        <div style="font-size:20px;font-weight:700;color:#fff">Your ChayanJobs Job Alert Digest</div>
        <div style="font-size:13px;color:#99f6e4;margin-top:4px">${items.length} fresh update${items.length === 1 ? "" : "s"} - ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px">
        <table style="width:100%;border-collapse:collapse">
          ${itemsHtml}
          <tr>
            <td style="padding:18px">
              <a href="${baseUrl}" style="display:inline-block;padding:10px 20px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:600">Browse All Updates</a>
            </td>
          </tr>
        </table>
      </div>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#999;font-size:12px;text-align:center">ChayanJobs - select right. serve right. | ${unsubscribeHtml}</p>
    </div>
  `

  if (!resend) {
    console.log(`[Email Mock] Newsletter digest to ${email}: ${items.length} items`)
    return { success: true, mocked: true }
  }

  const { data, error } = await resend.emails.send({
    from: `ChayanJobs <${fromEmail}>`,
    to: email,
    subject: `${items.length} new government job update${items.length === 1 ? "" : "s"} - ChayanJobs Digest`,
    html,
  })

  if (error) {
    console.error("Failed to send newsletter digest:", error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
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
        <div style="font-size:13px;color:#99f6e4;margin-top:4px">ChayanJobs application tracker reminder - ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
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
      <p style="color:#999;font-size:12px;text-align:center">ChayanJobs - select right. serve right. | You are receiving this because you are tracking applications.</p>
    </div>
  `

  if (!resend) {
    console.log(`[Email Mock] Application reminder to ${email}: ${reminders.length} reminders`)
    return { success: true, mocked: true }
  }

  const { data, error } = await resend.emails.send({
    from: `ChayanJobs <${fromEmail}>`,
    to: email,
    subject: `⏰ ${reminders.length} application deadline${reminders.length === 1 ? "" : "s"} coming up - ChayanJobs`,
    html,
  })

  if (error) {
    console.error("Failed to send application reminder email:", error)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

/**
 * Company-ownership OTP. Anti-phishing rules baked in:
 * - code only, NO login links (links are the #1 phishing vector)
 * - short expiry stated, single-use stated
 * - "never share / we never ask password" warnings
 * - minimal company info (name only), no sensitive data
 */
export async function sendCompanyVerificationOtp(email: string, otp: string, companyName: string) {
  const safeCompany = companyName.replace(/[<>&"]/g, "")
  const subject = `Verify ${safeCompany} - your ChayanJobs employer code`
  const html = `
    <div style="max-width:480px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
      <div style="background:linear-gradient(135deg,#134e4a,#0d9488);border-radius:12px 12px 0 0;padding:20px 24px">
        <div style="font-size:18px;font-weight:700;color:#fff">ChayanJobs Employer Verification</div>
        <div style="font-size:13px;color:#99f6e4;margin-top:4px">Confirm you own this work inbox</div>
      </div>
      <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px">
        <p style="color:#374151;font-size:14px;line-height:1.6">You requested employer access for <strong>${safeCompany}</strong>. Enter this code in ChayanJobs (Employer Studio → Step 1):</p>
        <div style="text-align:center;margin:20px 0">
          <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;color:#111827;background:#f3f4f6;border:1px dashed #9ca3af;border-radius:10px;padding:12px 20px 12px 28px">${otp}</span>
        </div>
        <p style="color:#374151;font-size:13px">Valid for <strong>10 minutes</strong>, single use. After 5 wrong tries the code is locked and you must request a new one.</p>
        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:12px 14px;margin-top:16px">
          <p style="color:#92400e;font-size:12px;margin:0;line-height:1.6"><strong>Security:</strong> never share this code. ChayanJobs will NEVER ask for your password, OTP or bank details over email or phone. Only enter the code on <strong>chayanjobs.com</strong> - check the address bar before typing.</p>
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:16px">Didn't request this? Ignore this email - your account stays unchanged. If this repeats, reset your ChayanJobs password.</p>
      </div>
      <p style="color:#9ca3af;font-size:11px;text-align:center;margin-top:16px">ChayanJobs - select right. serve right. | Automated mail from noreply, do not reply.</p>
    </div>
  `
  if (!resend) {
    console.log(`[Email Mock] Company OTP to ${email}: code ${otp} for ${safeCompany}`)
    return { success: true, mocked: true }
  }
  const { data, error } = await resend.emails.send({
    from: `ChayanJobs Verify <${fromEmail}>`,
    to: email,
    subject,
    html,
  })
  if (error) {
    console.error("Failed to send company OTP:", error.message)
    return { success: false, error: error.message }
  }
  return { success: true, id: data?.id }
}

export type ContactEmailOptions = {
  to?: string
  topicLabel?: string
  reference?: string
}

function escapeContactHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!)
}

export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string,
  options: ContactEmailOptions = {}
) {
  const to = options.to || "contact@chayanjobs.com"
  const safeName = escapeContactHtml(name)
  const safeSubject = escapeContactHtml(subject)
  const safeMessage = escapeContactHtml(message)
  const safeEmail = escapeContactHtml(email)
  const heading = options.topicLabel ? `New ${escapeContactHtml(options.topicLabel)} message` : "New Contact Message"
  const subheading = options.reference
    ? `Reference ${options.reference} · Received via the ChayanJobs contact page`
    : "Received via ChayanJobs website contact form"

  if (!resend) {
    return { success: false, error: "Contact email delivery is not configured" }
  }

  const { data, error } = await resend.emails.send({
    from: `ChayanJobs Contact <${fromEmail}>`,
    to,
    replyTo: email,
    subject: options.reference ? `[${options.reference}] ${subject}` : `[ChayanJobs Contact] ${subject}`,
    text: `Reference: ${options.reference || "N/A"}\nFrom: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
    html: `
      <div style="max-width:600px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
        <div style="background:#0d1117;border-radius:8px 8px 0 0;padding:24px 28px">
          <div style="font-size:20px;font-weight:700;color:#fff">${heading}</div>
          <div style="font-size:13px;color:#9aa4b2;margin-top:4px">${subheading}</div>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:24px 28px">
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:12px 0;font-size:11px;color:#656d76;text-transform:uppercase;letter-spacing:0.05em">From</td>
            </tr>
            <tr>
              <td style="padding:12px 0 24px 0;font-size:16px;font-weight:600;color:#111827">${safeName}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;font-size:11px;color:#656d76;text-transform:uppercase;letter-spacing:0.05em">Email</td>
            </tr>
            <tr>
              <td style="padding:12px 0 24px 0;font-size:15px;color:#111827">
                <a href="mailto:${safeEmail}" style="color:#0f766e;text-decoration:none">${safeEmail}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 0;font-size:11px;color:#656d76;text-transform:uppercase;letter-spacing:0.05em">Subject</td>
            </tr>
            <tr>
              <td style="padding:12px 0 24px 0;font-size:15px;color:#111827">${safeSubject}</td>
            </tr>
            <tr>
              <td style="padding:12px 0;font-size:11px;color:#656d76;text-transform:uppercase;letter-spacing:0.05em">Message</td>
            </tr>
            <tr>
              <td style="padding:12px 0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap">${safeMessage}</td>
            </tr>
          </table>
          <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e7eb">
            <div style="font-size:12px;color:#999">You can reply directly to this email to respond to ${safeName}.</div>
          </div>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#999;font-size:12px;text-align:center">ChayanJobs - select right. serve right.</p>
      </div>
    `,
  }, options.reference ? { idempotencyKey: `contact-team/${options.reference}` } : undefined)

  if (error) {
    console.error("Failed to send contact email:", error.name)
    return { success: false, error: error.message }
  }

  return { success: true, id: data?.id }
}

export async function sendContactAutoReply(
  to: string,
  name: string,
  reference: string,
  topicLabel: string,
  replyTime: string
) {
  const safeName = escapeContactHtml(name.split(" ")[0] || "there")

  if (!resend) {
    return { success: false, error: "Contact email delivery is not configured" }
  }

  const { data, error } = await resend.emails.send({
    from: `ChayanJobs Support <${fromEmail}>`,
    to,
    subject: `We received your message [${reference}]`,
    text: `Thanks ${name}, your message has been saved. Reference: ${reference}. We usually reply ${replyTime} on business days (Monday to Saturday, IST).`,
    html: `
      <div style="max-width:560px;margin:0 auto;padding:24px;font-family:Arial,sans-serif">
        <div style="border:1px solid #e5e7eb;border-radius:8px;padding:28px">
          <div style="font-size:18px;font-weight:700;color:#0d1117">Thanks ${safeName}, we got your message</div>
          <p style="color:#374151;font-size:14px;line-height:1.7">Your ${topicLabel.toLowerCase()} request is with the right team. Your reference number is <strong>${reference}</strong> — please include it in any follow-up.</p>
          <p style="color:#374151;font-size:14px;line-height:1.7">We usually reply ${replyTime} on business days (Monday to Saturday, IST).</p>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e5e7eb">
            <p style="color:#656d76;font-size:12px;line-height:1.6;margin:0">ChayanJobs will never ask for your password, OTP, or payment over email. This mailbox does not receive replies.</p>
          </div>
        </div>
        <p style="color:#999;font-size:12px;text-align:center">ChayanJobs - select right. serve right.</p>
      </div>
    `,
  }, { idempotencyKey: `contact-reply/${reference}` })

  if (error) {
    console.error("Failed to send contact auto-reply:", error.name)
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
