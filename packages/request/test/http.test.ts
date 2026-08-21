import { afterEach, describe, expect, it, vi } from "vitest"

import { ErrorCode } from "../src/contract.js"
import { createRequestClient, RequestError } from "../src/http.js"

const traceId = "11111111111111111111111111111111"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("request error contract", () => {
  it("解析受约束的 error code 并从 response header 关联 trace", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              code: ErrorCode.UNAUTHORIZED,
              message: "Authentication required",
            }),
            {
              headers: {
                "content-type": "application/json",
                "x-trace-id": traceId,
              },
              status: 401,
            }
          )
      )
    )

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.get("api/me").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: ErrorCode.UNAUTHORIZED,
      details: {
        code: ErrorCode.UNAUTHORIZED,
        message: "Authentication required",
      },
      message: "Authentication required",
      status: 401,
      traceId,
    })
  })

  it("未知 error code 不冒充已知契约并保留原始响应", async () => {
    const details = { code: "RATE_LIMITED", message: "Try again later" }
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(details), {
            headers: {
              "content-type": "application/json",
              "x-trace-id": traceId,
            },
            status: 429,
          })
      )
    )

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.post("api/resource").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: undefined,
      details,
      message: "Request failed with status 429",
      status: 429,
      traceId,
    })
  })

  it("error code 与 HTTP status 不匹配时拒绝该契约", async () => {
    const details = {
      code: ErrorCode.UNAUTHORIZED,
      message: "Authentication required",
    }
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(JSON.stringify(details), {
            headers: { "content-type": "application/json" },
            status: 500,
          })
      )
    )

    const api = createRequestClient({ baseUrl: "http://localhost/" })
    const error = await api.get("api/resource").catch((value: unknown) => value)

    expect(error).toBeInstanceOf(RequestError)
    expect(error).toMatchObject({
      code: undefined,
      details,
      message: "Request failed with status 500",
      status: 500,
    })
  })
})
