import * as blob from "@vercel/blob"

import type { ListResult, PutResult, Storage } from "./storage.ts"

export interface VercelBlobStorageOptions {
  token: string
}

export function createVercelBlobStorage(options: VercelBlobStorageOptions): Storage {
  return {
    async put(key, body, putOptions) {
      const result = await blob.put(key, body, {
        access: "public",
        contentType: putOptions?.contentType,
        token: options.token,
      })
      return { key, url: result.url } satisfies PutResult
    },

    async get(key) {
      const response = await fetch(key)
      if (!response.ok) return null
      return response.body
    },

    async delete(key) {
      await blob.del(key, { token: options.token })
    },

    async list(listOptions) {
      const result = await blob.list({
        cursor: listOptions?.cursor,
        limit: listOptions?.limit,
        prefix: listOptions?.prefix,
        token: options.token,
      })

      return {
        objects: result.blobs.map((item) => ({
          key: item.pathname,
          size: item.size,
          lastModified: new Date(item.uploadedAt),
        })),
        cursor: result.cursor,
      } satisfies ListResult
    },

    async getSignedUrl(key) {
      return key
    },
  }
}
