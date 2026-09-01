import { z } from "zod"

const optionalPublicId = z.string().trim().min(1).optional()

export const webEnv = {
  googleAnalyticsId: optionalPublicId.parse(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID),
  metaPixelId: optionalPublicId.parse(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  microsoftUetTagId: optionalPublicId.parse(process.env.NEXT_PUBLIC_MICROSOFT_UET_TAG_ID),
  serverUrl: z.url().parse(process.env.NEXT_PUBLIC_SERVER_URL),
}
