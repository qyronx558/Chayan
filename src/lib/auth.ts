import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { compare } from "bcryptjs"
import { prisma } from "./prisma"
import { verifyTOTP } from "./totp"
import type { DefaultSession } from "next-auth"

type Role = "USER" | "ADMIN" | "SUPER_ADMIN"

declare module "next-auth" {
  interface User {
    role: Role
  }
  interface Session {
    user: {
      id: string
      role: Role
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    // Google is optional: if its env vars are missing, including it with
    // `undefined` credentials crashes the whole [...nextauth] module and
    // turns EVERY /api/auth/* action (including /session) into an HTML 404.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        totpCode: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        let user: Record<string, unknown> | null = null
        try {
          user = await (prisma.user.findUnique as (a: unknown) => Promise<Record<string, unknown> | null>)({
            where: { email: credentials.email as string },
            select: {
              id: true, email: true, name: true, password: true,
              role: true, image: true,
              twoFactorEnabled: true, twoFactorSecret: true,
            },
          })
        } catch {
          user = await (prisma.user.findUnique as (a: unknown) => Promise<Record<string, unknown> | null>)({
            where: { email: credentials.email as string },
            select: { id: true, email: true, name: true, password: true, role: true, image: true },
          })
        }

        if (!user || !user.password) return null

        const isValid = await compare(credentials.password as string, user.password as string)
        if (!isValid) return null

        const has2FA = user.twoFactorEnabled === true && typeof user.twoFactorSecret === "string"
        if (has2FA) {
          const code = (credentials.totpCode as string | undefined) || ""
          if (!code || !/^\d{6}$/.test(code) || !verifyTOTP(user.twoFactorSecret as string, code)) {
            throw new Error("2FA_INVALID")
          }
        }

        return {
          id: user.id as string,
          email: user.email as string,
          name: user.name as string | null,
          role: (user.role as Role) || "USER",
          image: user.image as string | null,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, emailVerified: true },
        })
        if (dbUser) {
          user.role = dbUser.role
        }
      }
      return true
    },
    async jwt({ token, user, account, trigger, session }) {
      if (trigger === "update" && session) {
        token = { ...token, ...session }
      }
      if (user) {
        if (user.id) {
          token.id = user.id
          token.role = user.role || "USER"
        } else if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true },
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
          }
        }
        if (user.image) token.image = user.image
        if (account?.provider === "google" && !token.role) {
          token.role = "USER"
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as Role) || "USER"
        session.user.image =
          token.image !== undefined ? (token.image as string | null) : ((token.picture as string | null) ?? null)
      }
      return session
    },
  },
})
