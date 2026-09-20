import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { betterAuth } from "better-auth/minimal"
import { bearer } from "better-auth/plugins"

import type { Database } from "./database/client.ts"
import * as schema from "./database/schema.ts"

interface SocialProviderOptions {
  clientId: string
  clientSecret: string
}

export interface AuthOptions {
  baseURL: string
  database: Database
  google?: SocialProviderOptions
  secret: string
  trustedOrigins: string[]
}

export function createAuth(options: AuthOptions) {
  return betterAuth({
    appName: "Sweet Kit",
    baseURL: options.baseURL,
    database: drizzleAdapter(options.database, {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    secret: options.secret,
    socialProviders: {
      ...(options.google && {
        google: {
          clientId: options.google.clientId,
          clientSecret: options.google.clientSecret,
        },
      }),
    },
    trustedOrigins: options.trustedOrigins,
    plugins: [bearer()],
  })
}

export type Auth = ReturnType<typeof createAuth>
