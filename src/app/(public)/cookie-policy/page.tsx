import Link from "next/link"
import type { Metadata } from "next"
import { Clause, LegalPaper } from "@/components/legal/LegalPaper"

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "Cookie Policy of ChayanJobs. Learn about how we use cookies and similar tracking technologies.",
  openGraph: {
    title: "Cookie Policy - ChayanJobs",
    description: "Learn about how ChayanJobs uses cookies and similar tracking technologies.",
  },
}

export default function CookiePolicyPage() {
  return (
    <LegalPaper kind="cookies" title="Cookie Policy" updated="Last updated: July 15, 2026">

      <Clause title="What Are Cookies">
        <p>
          Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website.
          They help the website remember your preferences, understand how you use the site, and improve your browsing
          experience. Cookies do not contain personally identifiable information on their own.
        </p>
      </Clause>

      <Clause title="How We Use Cookies">
        <p>
          ChayanJobs uses cookies for the following purposes:
        </p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for the website to function properly. These enable core features like authentication and session management.</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our website by collecting anonymous data about page visits, time spent, and navigation patterns.</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences, such as theme selection and content filters.</li>
          <li><strong>Advertising Cookies:</strong> Used to deliver relevant advertisements and measure their effectiveness. These may be set by our advertising partners (e.g., Google AdSense).</li>
        </ul>
      </Clause>

      <Clause title="Third-Party Cookies">
        <p>
          We may allow third-party service providers to place cookies on your device. These include:
        </p>
        <ul>
          <li><strong>Google AdSense:</strong> Uses cookies to serve personalized advertisements based on your browsing history and interests.</li>
          <li><strong>Google Analytics:</strong> Uses cookies to collect anonymous traffic data and analyze site usage.</li>
          <li><strong>Social Media Platforms:</strong> If you share our content via social media buttons, those platforms may set their own cookies.</li>
        </ul>
        <p>
          We do not control third-party cookies. Please review the cookie policies of these third-party providers for more information.
        </p>
      </Clause>

      <Clause title="Managing Cookies">
        <p>
          You can control and manage cookies in several ways:
        </p>
        <ul>
          <li><strong>Cookie Consent Banner:</strong> When you first visit our site, a banner allows you to accept or decline non-essential cookies.</li>
          <li><strong>Browser Settings:</strong> Most browsers allow you to view, block, or delete cookies through their settings. You can typically find these options under the "Privacy" or "Security" section.</li>
          <li><strong>Opt-Out Tools:</strong> You can opt out of Google Analytics by installing the{" "}
            <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-Out Browser Add-on</a>.
          </li>
        </ul>
        <p>
          Please note that blocking or deleting cookies may affect certain features and functionality of our website.
        </p>
      </Clause>

      <Clause title="Google AdSense">
        <p>
          We use Google AdSense to serve advertisements on our website. Google and its partners may use cookies
          to serve ads based on your previous visits to our site or other websites. You can manage your Google
          ad personalization preferences at{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Google Ad Settings</a>.
        </p>
      </Clause>

      <Clause title="Your Consent">
        <p>
          By using our website, you consent to the use of cookies as described in this policy. If you decline
          cookies, we will only use essential cookies required for the website to function. You can change your
          cookie preferences at any time by clearing your browser cookies and reloading our site.
        </p>
      </Clause>

      <Clause title="Contact">
        <p>
          If you have any questions about our Cookie Policy, please{" "}
          <Link href="/contact">contact us</Link>.
        </p>
      </Clause>
    </LegalPaper>
  )
}
