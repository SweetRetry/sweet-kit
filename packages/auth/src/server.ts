import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import type { Database } from "@workspace/database/client"
import * as schema from "@workspace/database/schema"
import { betterAuth } from "better-auth/minimal"
import { bearer, deviceAuthorization } from "better-auth/plugins"

import { CLI_CLIENT_ID } from "./constants.ts"

export interface SocialProviderOptions {
  clientId: string
  clientSecret: string
}

export interface AuthOptions {
  baseURL: string
  database: Database
  google?: SocialProviderOptions
  secret: string
  trustedOrigins: string[]
  verificationUri: string
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
    plugins: [
      bearer(),
      deviceAuthorization({
        verificationUri: options.verificationUri,
        validateClient: (clientId) => clientId === CLI_CLIENT_ID,
      }),
    ],
  })
}

export type Auth = ReturnType<typeof createAuth>
