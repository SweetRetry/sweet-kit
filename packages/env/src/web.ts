import { z } from "zod"

export const webEnv = {
  serverUrl: z.url().parse(process.env.NEXT_PUBLIC_SERVER_URL),
}
