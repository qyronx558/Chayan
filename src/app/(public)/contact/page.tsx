"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Send, Mail, MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Name is required"
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!EMAIL_REGEX.test(formData.email)) {
      newErrors.email = "Please enter a valid email address"
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required"
    } else if (formData.subject.trim().length < 3) {
      newErrors.subject = "Subject must be at least 3 characters"
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message")
      }

      setIsSubmitted(true)
      toast("Message sent successfully! We'll get back to you soon.", "success")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong"
      toast(message, "destructive")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({ name: "", email: "", subject: "", message: "" })
    setErrors({})
    setIsSubmitted(false)
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "Email",
      value: "contact@chayanjobs.com",
      href: "mailto:contact@chayanjobs.com",
      description: "We typically respond within 24 hours",
    },
    {
      icon: MapPin,
      title: "Office",
      value: "42, Sector 14, New Delhi - 110070",
      href: "https://maps.google.com/?q=42+Sector+14+New+Delhi+110070",
      description: "Visit us during business hours",
    },
  ]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-12 text-center"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 mb-6">
          <span className="text-sm font-medium">Get in Touch</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          We'd Love to Hear From You
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Whether you have a question about our platform, need support, or want to share feedback,
          our team is here to help. Drop us a line and we'll get back to you promptly.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Info & Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-gray-100 dark:border-gray-800 shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Contact Information</CardTitle>
              <CardDescription>
                Choose the best way to reach us
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {contactInfo.map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                  className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-teal-50/50 dark:hover:bg-teal-900/20 transition-colors"
                >
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{item.title}</h3>
                    <a
                      href={item.href}
                      className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors block mt-1"
                    >
                      {item.value}
                    </a>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                  </div>
                </motion.div>
              ))}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Response Time</h3>
                <div className="grid gap-2 sm:grid-cols-3 text-sm">
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">General inquiries: <span className="font-medium">24 hrs</span></span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Technical support: <span className="font-medium">12 hrs</span></span>
                  </div>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20">
                    <CheckCircle className="h-4 w-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">Business inquiries: <span className="font-medium">48 hrs</span></span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-gray-100 dark:border-gray-800 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-600 to-teal-400 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Send Us a Message</CardTitle>
                  <CardDescription>Fill out the form and we'll get back to you</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isSubmitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                    Thank you for reaching out. We've received your message and will get back to you within 24 hours.
                  </p>
                  <Button onClick={handleReset} className="w-full sm:w-auto">
                    Send Another Message
                  </Button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className={cn(errors.name && "border-red-500 focus-visible:ring-red-500")}
                        disabled={isLoading}
                        autoComplete="name"
                        autoFocus
                      />
                      {errors.name && (
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
                        disabled={isLoading}
                        autoComplete="email"
                      />
                      {errors.email && (
                        <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
                          <AlertCircle className="h-3.5 w-3.5" />
                          {errors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className={cn(errors.subject && "border-red-500 focus-visible:ring-red-500")}
                      disabled={isLoading}
                    />
                    {errors.subject && (
                      <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.subject}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      rows={5}
                      className={cn(errors.message && "border-red-500 focus-visible:ring-red-500")}
                      disabled={isLoading}
                    />
                    {errors.message && (
                      <p className="mt-1.5 flex items-center gap-1 text-sm text-red-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {errors.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Minimum 10 characters
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full py-3.5 text-lg"
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </Button>

                  <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                    By submitting this form, you agree to our{" "}
                    <a href="/privacy" className="text-teal-600 hover:underline underline-offset-1">Privacy Policy</a>
                    {" "}and{" "}
                    <a href="/terms" className="text-teal-600 hover:underline underline-offset-1">Terms of Service</a>
                    {"."}
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Trust indicators */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="mt-16"
      >
        <div className="grid gap-6 md:grid-cols-4">
          {[
            { icon: CheckCircle, title: "24/7 Support", desc: "Round-the-clock assistance" },
            { icon: Mail, title: "Quick Response", desc: "Average reply under 12 hours" },
            { icon: CheckCircle, title: "Secure", desc: "Your data is encrypted" },
            { icon: CheckCircle, title: "Free Forever", desc: "No hidden charges" },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                <item.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}