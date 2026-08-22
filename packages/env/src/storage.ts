import { z } from "zod"

const values = z
  .object({
    STORAGE_PROVIDER: z.enum(["s3", "vercel-blob"]),
    S3_ENDPOINT: z.url(),
    S3_BUCKET: z.string().min(1),
    S3_REGION: z.string().min(1),
    S3_ACCESS_KEY_ID: z.string().min(1),
    S3_SECRET_ACCESS_KEY: z.string().min(1),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  })
  .parse(process.env)

export const storageEnv = {
  provider: values.STORAGE_PROVIDER,
  s3: {
    endpoint: values.S3_ENDPOINT,
    bucket: values.S3_BUCKET,
    region: values.S3_REGION,
    credentials: {
      accessKeyId: values.S3_ACCESS_KEY_ID,
      secretAccessKey: values.S3_SECRET_ACCESS_KEY,
    },
  },
  vercelBlob: {
    token: values.BLOB_READ_WRITE_TOKEN,
  },
}
