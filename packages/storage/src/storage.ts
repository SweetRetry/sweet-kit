export interface StorageObject {
  key: string
  size: number
  lastModified: Date
}

export interface PutResult {
  key: string
  url: string
}

export interface ListResult {
  objects: StorageObject[]
  cursor?: string
}

export interface Storage {
  put(
    key: string,
    body: Buffer | ReadableStream | string,
    options?: { contentType?: string }
  ): Promise<PutResult>
  get(key: string): Promise<ReadableStream | null>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; cursor?: string; limit?: number }): Promise<ListResult>
  getSignedUrl(key: string, expiresIn?: number): Promise<string>
}
