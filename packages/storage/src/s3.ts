import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import type { ListResult, PutResult, Storage } from "./storage.ts"

export interface S3StorageOptions {
  bucket: string
  endpoint: string
  region?: string
  credentials: {
    accessKeyId: string
    secretAccessKey: string
  }
  forcePathStyle?: boolean
  publicUrl?: string
}

export function createS3Storage(options: S3StorageOptions): Storage {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: options.region ?? "us-east-1",
    credentials: options.credentials,
    forcePathStyle: options.forcePathStyle ?? true,
  })

  const bucket = options.bucket
  const publicUrl = options.publicUrl ?? `${options.endpoint}/${bucket}`

  return {
    async put(key, body, putOptions) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: putOptions?.contentType,
        })
      )
      return { key, url: `${publicUrl}/${key}` } satisfies PutResult
    },

    async get(key) {
      const response = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }))
      return (response.Body?.transformToWebStream() as ReadableStream) ?? null
    },

    async delete(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
    },

    async list(listOptions) {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: listOptions?.prefix,
          ContinuationToken: listOptions?.cursor,
          MaxKeys: listOptions?.limit,
        })
      )

      return {
        objects: (response.Contents ?? []).map((item) => ({
          key: item.Key ?? "",
          size: item.Size ?? 0,
          lastModified: item.LastModified ?? new Date(),
        })),
        cursor: response.NextContinuationToken,
      } satisfies ListResult
    },

    async getSignedUrl(key, expiresIn = 3600) {
      const command = new GetObjectCommand({ Bucket: bucket, Key: key })
      return getSignedUrl(client, command, { expiresIn })
    },
  }
}
