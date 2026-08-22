import "dotenv/config"
import { z } from "zod"

const values = z
  .object({
    STORAGE_PROVIDER: z.enum(["s3", "vercel-blob"]).default("s3"),
    S3_ENDPOINT: z.string().url().default("http://localhost:9000"),
    S3_BUCKET: z.string().min(1).default("sweet-kit"),
    S3_REGION: z.string().min(1).default("us-east-1"),
    S3_ACCESS_KEY_ID: z.string().min(1).default("sweet"),
    S3_SECRET_ACCESS_KEY: z.string().min(1).default("sweetsweet"),
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
