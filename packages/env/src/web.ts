import { z } from "zod"

export const webEnv = {
  serverUrl: z
    .string()
    .url()
    .parse(process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001"),
}
